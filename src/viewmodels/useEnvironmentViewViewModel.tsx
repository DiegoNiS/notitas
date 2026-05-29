// Ruta: src/viewmodels/useEnvironmentViewViewModel.tsx
import { useState, useEffect } from 'react';
import { ShortcutManager } from '../keyboard/ShortcutManager';
import { CursoDetalle, db, TareaDetail, Ambiente, Nota } from '../services/database';

const lastFocusedCache: Record<string, string> = {};

export function useEnvironmentViewViewModel(
    curso: CursoDetalle | null,
    ambienteId: string,
    onBack: () => void,
    navigateTo: (route: any) => void
) {
    const [tareas, setTareas] = useState<TareaDetail[]>([]);
    const [notas, setNotas] = useState<Nota[]>([]);
    const [ambiente, setAmbiente] = useState<Ambiente | null>(null);
    const [activeTaskIndex, setActiveTaskIndex] = useState(0);
    const [activeNoteIndex, setActiveNoteIndex] = useState(0);

    const cursoId = curso?.id || '';

    // Cargar datos del ambiente y tareas/notas asociadas
    useEffect(() => {
        if (!cursoId || !ambienteId) return;

        let active = true;

        async function cargarDatos() {
            const listAmbientes = await db.obtenerAmbientesBase();
            const currentAmb = listAmbientes.find(a => a.id === ambienteId) || null;
            
            const [listTareas, listNotas] = await Promise.all([
                db.obtenerTareasPendientesPorCursoAmbiente(cursoId, ambienteId),
                db.obtenerNotasPorCursoAmbiente(cursoId, ambienteId)
            ]);

            if (active) {
                setAmbiente(currentAmb);
                setTareas(listTareas);
                setNotas(listNotas);
            }
        }

        cargarDatos();

        return () => {
            active = false;
        };
    }, [cursoId, ambienteId]);

    // Crear una nota y redirigir
    const handleCrearNota = async () => {
        if (!cursoId || !ambienteId) return;
        const newNoteId = await db.crearNota(cursoId, ambienteId, 'Nueva Nota', '# Nueva Nota\n\n');
        navigateTo({ type: 'editor', courseId: cursoId, ambienteId, notaId: newNoteId });
    };

    // Registrar atajos de teclado globales para esta vista
    useEffect(() => {
        ShortcutManager.registerGroup('environmentView', [
            { code: 'Escape', action: () => onBack() },
            { code: 'ArrowLeft', altKey: true, action: (e) => { e.preventDefault(); onBack(); } },
            { code: 'KeyN', ctrlKey: true, action: (e) => { e.preventDefault(); handleCrearNota(); } }
        ]);

        return () => {
            ShortcutManager.unregisterGroup('environmentView');
        };
    }, [onBack, cursoId, ambienteId]);

    // Restaurar foco al montar
    useEffect(() => {
        if (!cursoId || !ambienteId) return;
        const cacheKey = `${cursoId}-${ambienteId}`;

        const timer = setTimeout(() => {
            const cachedId = lastFocusedCache[cacheKey] || 'task-0';
            const element = document.getElementById(cachedId);
            if (element) {
                element.focus();
            } else {
                // Si no hay tareas, intentar enfocar la primera nota
                const noteElement = document.getElementById('note-0');
                if (noteElement) noteElement.focus();
            }
        }, 150);

        return () => clearTimeout(timer);
    }, [cursoId, ambienteId]);

    // Guardar foco en el caché
    const handleElementFocus = (id: string) => {
        if (cursoId && ambienteId) {
            const cacheKey = `${cursoId}-${ambienteId}`;
            lastFocusedCache[cacheKey] = id;
        }
    };

    // Cambiar estado de una tarea
    const toggleTaskStatus = async (task: TareaDetail) => {
        let nuevoEstado: 'incomplete' | 'in_progress' | 'completed';
        if (task.estado === 'incomplete') {
            nuevoEstado = 'in_progress';
        } else if (task.estado === 'in_progress') {
            nuevoEstado = 'completed';
        } else {
            nuevoEstado = 'incomplete';
        }

        // Actualizar UI localmente
        setTareas(prev => prev.map(t => t.id === task.id ? { ...t, estado: nuevoEstado } : t));

        // Actualizar base de datos
        await db.actualizarTareaEstado(task.id, nuevoEstado);
    };

    return {
        tareas,
        notas,
        ambiente,
        activeTaskIndex,
        setActiveTaskIndex,
        activeNoteIndex,
        setActiveNoteIndex,
        handleElementFocus,
        toggleTaskStatus,
        handleCrearNota
    };
}
