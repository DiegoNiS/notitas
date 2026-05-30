// Ruta: src/viewmodels/useEnvironmentViewViewModel.tsx
import { useState, useEffect, useRef } from 'react';
import { ShortcutManager } from '../keyboard/ShortcutManager';
import { CursoDetalle, db, TareaDetail, Ambiente, Nota } from '../services/database';
import { useCtrlTabSwitcher } from '../keyboard/useCtrlTabSwitcher';

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
    const [mode, setMode] = useState<'notes' | 'tasks'>('notes');

    const cursoId = curso?.id || '';

    const switcherItems: (Nota | TareaDetail)[] = mode === 'notes' ? notas : tareas;

    const switcher = useCtrlTabSwitcher<Nota | TareaDetail>({
        items: switcherItems,
        onSelect: (item) => {
            if (mode === 'notes') {
                const nota = item as Nota;
                navigateTo({ type: 'editor', courseId: cursoId, ambienteId, notaId: nota.id });
            } else {
                const tarea = item as TareaDetail;
                navigateTo({ type: 'editor', courseId: cursoId, ambienteId, notaId: tarea.notaId });
            }
        }
    });

    // Guardamos la referencia para el toggle
    const stateRef = useRef({ mode });
    stateRef.current = { mode };

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
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const defaultTitle = `Nota de ${mm}/${dd}`;
        const newNoteId = await db.crearNota(cursoId, ambienteId, defaultTitle, `# ${defaultTitle}\n\n`);
        navigateTo({ type: 'editor', courseId: cursoId, ambienteId, notaId: newNoteId });
    };

    // Alternar modo (Notas <-> Tareas)
    const toggleMode = () => {
        setMode(prev => {
            const next = prev === 'notes' ? 'tasks' : 'notes';
            
            // Foco al primer elemento del nuevo modo activo
            setTimeout(() => {
                const prefix = next === 'notes' ? 'note' : 'task';
                const cachedId = lastFocusedCache[`${cursoId}-${ambienteId}-${prefix}`] || `${prefix}-0`;
                const element = document.getElementById(cachedId);
                if (element) {
                    element.focus();
                }
            }, 100);

            return next;
        });
    };

    // Registrar atajos de teclado globales para esta vista
    useEffect(() => {
        ShortcutManager.registerGroup('environmentView', [
            { code: 'Escape', action: () => onBack(), description: 'Regresar a la pantalla anterior' },
            { code: 'ArrowLeft', altKey: true, action: (e) => { e.preventDefault(); onBack(); }, description: 'Regresar a la pantalla anterior' },
            { code: 'KeyN', ctrlKey: true, action: (e) => { e.preventDefault(); handleCrearNota(); }, description: 'Crear nueva nota' },
            { 
                code: 'Tab', 
                altKey: true, 
                action: (e) => { 
                    e.preventDefault(); 
                    toggleMode(); 
                },
                description: 'Alternar entre vista de notas y tareas'
            },
            { 
                code: 'KeyM', 
                altKey: true, 
                action: (e) => { 
                    e.preventDefault(); 
                    toggleMode(); 
                },
                description: 'Alternar entre vista de notas y tareas'
            }
        ]);


        return () => {
            ShortcutManager.unregisterGroup('environmentView');
        };
    }, [onBack, cursoId, ambienteId]);

    // Restaurar foco al montar o al cambiar de modo
    useEffect(() => {
        if (!cursoId || !ambienteId) return;

        const timer = setTimeout(() => {
            const currentPrefix = stateRef.current.mode === 'notes' ? 'note' : 'task';
            const cacheKey = `${cursoId}-${ambienteId}-${currentPrefix}`;
            const cachedId = lastFocusedCache[cacheKey] || `${currentPrefix}-0`;
            const element = document.getElementById(cachedId);
            if (element) {
                element.focus();
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [cursoId, ambienteId, mode, notas, tareas]);

    // Guardar foco en el caché
    const handleElementFocus = (id: string) => {
        if (cursoId && ambienteId) {
            const currentPrefix = stateRef.current.mode === 'notes' ? 'note' : 'task';
            const cacheKey = `${cursoId}-${ambienteId}-${currentPrefix}`;
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
        mode,
        setMode,
        toggleMode,
        activeTaskIndex,
        setActiveTaskIndex,
        activeNoteIndex,
        setActiveNoteIndex,
        handleElementFocus,
        toggleTaskStatus,
        handleCrearNota,
        switcher
    };
}
