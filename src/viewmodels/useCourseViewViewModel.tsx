import { useState, useEffect } from 'react';
import { ShortcutManager } from '../keyboard/ShortcutManager';
import { CursoDetalle, db, TareaDetail, Ambiente, parseTaskDueDateToNumber } from '../services/database';
import { useCtrlTabSwitcher } from '../keyboard/useCtrlTabSwitcher';
import { ShortcutConfig } from '../keyboard/types';

export function useCourseViewViewModel(
    curso: CursoDetalle | null,
    onBack: () => void,
    onSelectAmbiente: (ambienteId: string) => void,
    onSelectNota: (notaId: string, ambienteId: string) => void
) {
    const [tareas, setTareas] = useState<TareaDetail[]>([]);
    const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
    const [ambienteFiltrado, setAmbienteFiltrado] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'environments' | 'tasks'>('environments');
    const [focusedIndex, setFocusedIndex] = useState<number>(0);

    // Reset focused index when changing tabs
    useEffect(() => {
        setFocusedIndex(0);
    }, [activeTab]);

    // Reset active tab and focused index when curso changes
    useEffect(() => {
        setActiveTab('environments');
        setFocusedIndex(0);
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
                listTareas.sort((a, b) => parseTaskDueDateToNumber(a.fechaEntrega) - parseTaskDueDateToNumber(b.fechaEntrega));
                setAmbientes(listAmbientes);
                setTareas(listTareas);
            }
        }

        cargarDatos();

        return () => {
            active = false;
        };
    }, [curso]);

    // Configurar el switcher de ambientes
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

    const itemsCount = activeTab === 'environments' ? ambientes.length : tareas.length;

    // Registrar atajos de teclado globales
    useEffect(() => {
        const shortcuts: ShortcutConfig[] = [
            { code: 'Escape', action: () => onBack(), description: 'Regresar a la pantalla anterior' },
            { code: 'ArrowLeft', altKey: true, action: (e) => { e.preventDefault(); onBack(); }, description: 'Regresar a la pantalla anterior' },
            
            // Navegar entre pestañas
            {
                code: 'ArrowLeft',
                action: (e) => {
                    e.preventDefault();
                    setActiveTab('environments');
                },
                description: 'Cambiar a la pestaña de Ambientes'
            },
            {
                code: 'ArrowRight',
                action: (e) => {
                    e.preventDefault();
                    setActiveTab('tasks');
                },
                description: 'Cambiar a la pestaña de Tareas Pendientes'
            },
            
            // Navegación arriba/abajo
            {
                codeMatcher: (code) => code === 'ArrowDown' || code === 'ArrowUp',
                action: (e) => {
                    e.preventDefault();
                    if (e.code === 'ArrowDown') {
                        setFocusedIndex(prev => Math.min(prev + 1, itemsCount - 1));
                    } else {
                        setFocusedIndex(prev => Math.max(prev - 1, 0));
                    }
                },
                description: 'Mover el foco arriba/abajo por la lista',
                keyDisplay: '↑ / ↓'
            },
            
            // Ejecutar/Abrir elemento
            {
                code: 'Enter',
                action: (e) => {
                    e.preventDefault();
                    if (activeTab === 'environments') {
                        const amb = ambientes[focusedIndex];
                        if (amb) {
                            onSelectAmbiente(amb.id);
                        }
                    } else {
                        const task = tareas[focusedIndex];
                        if (task && task.notaId) {
                            onSelectNota(task.notaId, task.ambienteId);
                        }
                    }
                },
                description: 'Abrir elemento enfocado'
            },
            
            // Alternar estado de la tarea (solo en pestaña de tareas)
            {
                code: 'Space',
                action: (e) => {
                    if (activeTab === 'tasks') {
                        e.preventDefault();
                        const task = tareas[focusedIndex];
                        if (task) {
                            toggleTaskStatus(task);
                        }
                    }
                },
                description: 'Alternar estado de la tarea'
            }
        ];

        ShortcutManager.registerGroup('courseView', shortcuts);

        return () => {
            ShortcutManager.unregisterGroup('courseView');
        };
    }, [ambientes, tareas, activeTab, focusedIndex, itemsCount, onBack, onSelectAmbiente, onSelectNota]);

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
        activeTab,
        setActiveTab,
        focusedIndex,
        setFocusedIndex
    };
}
