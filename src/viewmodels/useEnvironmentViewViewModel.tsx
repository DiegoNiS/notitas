// Ruta: src/viewmodels/useEnvironmentViewViewModel.tsx
import { useState, useEffect } from 'react';
import { ShortcutManager } from '../keyboard/ShortcutManager';
import { CursoDetalle, db, TareaDetail, Ambiente, Nota, parseTaskDueDateToNumber } from '../services/database';
import { useCtrlTabSwitcher } from '../keyboard/useCtrlTabSwitcher';
import { ShortcutConfig } from '../keyboard/types';

export function useEnvironmentViewViewModel(
    curso: CursoDetalle | null,
    ambienteId: string,
    onBack: () => void,
    navigateTo: (route: any) => void
) {
    const [tareas, setTareas] = useState<TareaDetail[]>([]);
    const [notas, setNotas] = useState<Nota[]>([]);
    const [ambiente, setAmbiente] = useState<Ambiente | null>(null);
    const [focusedIndex, setFocusedIndex] = useState<number>(0);
    const [mode, setMode] = useState<'notes' | 'tasks'>('notes');

    // Estados para el Spotlight (Ctrl + K) de notas
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuOptionIndex, setMenuOptionIndex] = useState(0);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [notaAEliminar, setNotaAEliminar] = useState<Nota | null>(null);

    const OPCIONES_MENU = ['Abrir', 'Eliminar'];

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

    // Reset focusedIndex when switching modes
    useEffect(() => {
        setFocusedIndex(0);
    }, [mode]);

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
                // Ordenar tareas por plazo (más cercano primero)
                listTareas.sort((a, b) => parseTaskDueDateToNumber(a.fechaEntrega) - parseTaskDueDateToNumber(b.fechaEntrega));
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
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const defaultTitle = `Nota de ${mm}/${dd} ${hh}:${min}`;
        const newNoteId = await db.crearNota(cursoId, ambienteId, defaultTitle, `# ${defaultTitle}\n\n`);
        navigateTo({ type: 'editor', courseId: cursoId, ambienteId, notaId: newNoteId });
    };

    const handleEjecutarOpcion = async () => {
        if (focusedIndex === 0) {
            handleCrearNota();
            setIsMenuOpen(false);
            return;
        }
        const nota = notas[focusedIndex - 1];
        if (!nota) return;

        const opcion = OPCIONES_MENU[menuOptionIndex];
        if (opcion === 'Abrir') {
            navigateTo({ type: 'editor', courseId: cursoId, ambienteId, notaId: nota.id });
        } else if (opcion === 'Eliminar') {
            setNotaAEliminar(nota);
            setIsConfirmDeleteOpen(true);
        }
        setIsMenuOpen(false);
    };

    const handleEliminarNotaConfirmado = async () => {
        if (!notaAEliminar) return;
        try {
            await db.eliminarNota(notaAEliminar.id);
            setNotaAEliminar(null);
            
            // Recargar
            const listNotas = await db.obtenerNotasPorCursoAmbiente(cursoId, ambienteId);
            const listTareas = await db.obtenerTareasPendientesPorCursoAmbiente(cursoId, ambienteId);
            listTareas.sort((a, b) => parseTaskDueDateToNumber(a.fechaEntrega) - parseTaskDueDateToNumber(b.fechaEntrega));
            setNotas(listNotas);
            setTareas(listTareas);
            setFocusedIndex(0);
        } catch (e) {
            console.error('Error al eliminar nota:', e);
        }
    };

    const itemsCount = mode === 'notes' ? notas.length + 1 : tareas.length;

    // Registrar atajos de teclado globales para esta vista
    useEffect(() => {
        const shortcuts: ShortcutConfig[] = [
            { code: 'Escape', action: () => onBack(), description: 'Regresar a la pantalla anterior' },
            { code: 'ArrowLeft', altKey: true, action: (e) => { e.preventDefault(); onBack(); }, description: 'Regresar a la pantalla anterior' },
            { code: 'KeyN', ctrlKey: true, action: (e) => { e.preventDefault(); handleCrearNota(); }, description: 'Crear nueva nota' },
            
            // Cambiar entre pestañas
            {
                code: 'ArrowLeft',
                action: (e) => {
                    e.preventDefault();
                    setMode('notes');
                },
                description: 'Cambiar a la pestaña de Notas'
            },
            {
                code: 'ArrowRight',
                action: (e) => {
                    e.preventDefault();
                    setMode('tasks');
                },
                description: 'Cambiar a la pestaña de Tareas Pendientes'
            }
        ];

        if (isMenuOpen) {
            shortcuts.push(
                {
                    code: 'Escape',
                    action: (e) => {
                        e.preventDefault();
                        setIsMenuOpen(false);
                    },
                    description: 'Cerrar el menú Spotlight'
                },
                {
                    code: 'ArrowDown',
                    action: (e) => {
                        e.preventDefault();
                        setMenuOptionIndex(prev => Math.min(prev + 1, OPCIONES_MENU.length - 1));
                    },
                    description: 'Bajar en las opciones del menú'
                },
                {
                    code: 'ArrowUp',
                    action: (e) => {
                        e.preventDefault();
                        setMenuOptionIndex(prev => Math.max(prev - 1, 0));
                    },
                    description: 'Subir en las opciones del menú'
                },
                {
                    code: 'Enter',
                    action: (e) => {
                        e.preventDefault();
                        handleEjecutarOpcion();
                    },
                    description: 'Ejecutar opción seleccionada'
                }
            );
        } else {
            // Shortcuts cuando el menú no está abierto
            shortcuts.push(
                {
                    code: 'KeyK',
                    ctrlKey: true,
                    action: (e) => {
                        e.preventDefault();
                        if (mode === 'notes' && focusedIndex > 0) {
                            setMenuOptionIndex(0);
                            setIsMenuOpen(true);
                        }
                    },
                    description: 'Abrir menú de opciones para la nota enfocada'
                },
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
                {
                    code: 'Enter',
                    action: (e) => {
                        e.preventDefault();
                        if (mode === 'notes') {
                            if (focusedIndex === 0) {
                                handleCrearNota();
                            } else {
                                const nota = notas[focusedIndex - 1];
                                if (nota) {
                                    navigateTo({ type: 'editor', courseId: cursoId, ambienteId, notaId: nota.id });
                                }
                            }
                        } else {
                            const task = tareas[focusedIndex];
                            if (task && task.notaId) {
                                navigateTo({ type: 'editor', courseId: cursoId, ambienteId, notaId: task.notaId });
                            }
                        }
                    },
                    description: 'Abrir elemento enfocado'
                },
                {
                    code: 'Space',
                    action: (e) => {
                        if (mode === 'tasks') {
                            e.preventDefault();
                            const task = tareas[focusedIndex];
                            if (task) {
                                toggleTaskStatus(task);
                            }
                        }
                    },
                    description: 'Alternar estado de la tarea'
                }
            );
        }

        ShortcutManager.registerGroup('environmentView', shortcuts);

        return () => {
            ShortcutManager.unregisterGroup('environmentView');
        };
    }, [onBack, cursoId, ambienteId, mode, focusedIndex, isMenuOpen, menuOptionIndex, notas, tareas, itemsCount]);

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
        focusedIndex,
        setFocusedIndex,
        toggleTaskStatus,
        handleCrearNota,
        switcher,
        isMenuOpen,
        setIsMenuOpen,
        menuOptionIndex,
        setMenuOptionIndex,
        isConfirmDeleteOpen,
        setIsConfirmDeleteOpen,
        notaAEliminar,
        setNotaAEliminar,
        OPCIONES_MENU,
        handleEjecutarOpcion,
        handleEliminarNotaConfirmado
    };
}
