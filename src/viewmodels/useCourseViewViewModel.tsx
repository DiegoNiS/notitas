import { useState, useEffect } from 'react';
import { ShortcutManager } from '../keyboard/ShortcutManager';
import { CursoDetalle, db, TareaDetail, Ambiente } from '../services/database';
import { useCtrlTabSwitcher } from '../keyboard/useCtrlTabSwitcher';

// Caché a nivel de módulo para recordar el último elemento enfocado por curso
const lastFocusedCache: Record<string, string> = {};

export function useCourseViewViewModel(
    curso: CursoDetalle | null,
    onBack: () => void,
    onSelectAmbiente: (ambienteId: string) => void
) {
    const [tareas, setTareas] = useState<TareaDetail[]>([]);
    const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
    const [ambienteFiltrado, setAmbienteFiltrado] = useState<string | null>(null);
    const [activeEnvIndex, setActiveEnvIndex] = useState(0);
    const [activeTaskIndex, setActiveTaskIndex] = useState(0);

    // Reset indices when curso changes
    useEffect(() => {
        setActiveEnvIndex(0);
        setActiveTaskIndex(0);
    }, [curso?.id]);

    // Cargar datos del curso (ambientes y tareas pendientes)
    useEffect(() => {
        if (!curso) return;
        const cursoId = curso.id;
        let active = true;

        async function cargarDatos() {
            const [listAmbientes, listTareas] = await Promise.all([
                db.obtenerAmbientesPorCurso(cursoId),
                db.obtenerTareasPendientesPorCurso(cursoId)
            ]);
            if (active) {
                setAmbientes(listAmbientes);
                setTareas(listTareas);
            }
        }

        cargarDatos();

        return () => {
            active = false;
        };
    }, [curso]);

    // Configurar el switcher de ambientes (sin "TODOS LOS AMBIENTES")
    const switcherItems = curso ? curso.ambientes : [];
    const switcher = useCtrlTabSwitcher({
        items: switcherItems,
        onSelect: (item) => {
            const ambObj = ambientes.find(a => a.nombre === item);
            if (ambObj) {
                onSelectAmbiente(ambObj.id);
            }
        }
    });

    // Registrar atajos de teclado para volver
    useEffect(() => {
        ShortcutManager.registerGroup('courseView', [
            { code: 'Escape', action: () => onBack() },
            { code: 'ArrowLeft', altKey: true, action: (e) => { e.preventDefault(); onBack(); } },
        ]);

        return () => {
            ShortcutManager.unregisterGroup('courseView');
        };
    }, [onBack]);

    // Restaurar foco al montar
    useEffect(() => {
        if (!curso) return;

        const timer = setTimeout(() => {
            const cachedId = lastFocusedCache[curso.id] || 'env-0';
            const element = document.getElementById(cachedId);
            if (element) {
                element.focus();
            }
        }, 150); // Pequeño delay para asegurar que el DOM se haya renderizado

        return () => clearTimeout(timer);
    }, [curso]);

    // Guardar el foco en el caché
    const handleElementFocus = (id: string) => {
        if (curso) {
            lastFocusedCache[curso.id] = id;
        }
    };

    // Cambiar de estado de una tarea
    const toggleTaskStatus = async (task: TareaDetail) => {
        let nuevoEstado: 'incomplete' | 'in_progress' | 'completed';
        if (task.estado === 'incomplete') {
            nuevoEstado = 'in_progress';
        } else if (task.estado === 'in_progress') {
            nuevoEstado = 'completed';
        } else {
            nuevoEstado = 'incomplete';
        }

        // Actualizar UI local inmediatamente
        setTareas(prev => prev.map(t => t.id === task.id ? { ...t, estado: nuevoEstado } : t));

        // Actualizar en BD (en segundo plano)
        await db.actualizarTareaEstado(task.id, nuevoEstado);
    };

    return {
        tareas,
        ambientes,
        ambienteFiltrado,
        setAmbienteFiltrado,
        switcher,
        switcherItems,
        toggleTaskStatus,
        handleElementFocus,
        activeEnvIndex,
        setActiveEnvIndex,
        activeTaskIndex,
        setActiveTaskIndex
    };
}
