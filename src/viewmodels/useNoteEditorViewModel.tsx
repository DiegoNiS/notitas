// Ruta: src/viewmodels/useNoteEditorViewModel.tsx
import { useState, useEffect, useRef } from 'react';
import { ShortcutManager } from '../keyboard/ShortcutManager';
import { db, TareaDetail, Nota, updateTaskStateInMarkdown, parseTaskDueDateToNumber } from '../services/database';
import { useCtrlTabSwitcher } from '../keyboard/useCtrlTabSwitcher';

const lastFocusedCache: Record<string, string> = {};

const replaceLatexAccents = (text: string): string => {
  return text
    .replace(/\\'a/g, 'á')
    .replace(/\\'e/g, 'é')
    .replace(/\\'i/g, 'í')
    .replace(/\\'o/g, 'ó')
    .replace(/\\'u/g, 'ú')
    .replace(/\\'A/g, 'Á')
    .replace(/\\'E/g, 'É')
    .replace(/\\'I/g, 'Í')
    .replace(/\\'O/g, 'Ó')
    .replace(/\\'U/g, 'Ú')
    .replace(/\\~n/g, 'ñ')
    .replace(/\\~N/g, 'Ñ');
};

export function useNoteEditorViewModel(
    notaId: string,
    onBack: () => void,
    navigateTo: (route: any) => void
) {
    const [note, setNote] = useState<Nota | null>(null);
    const [notesInEnv, setNotesInEnv] = useState<Nota[]>([]);
    const [markdown, setMarkdown] = useState('');
    const [mode, setMode] = useState<'editor' | 'tasks'>('editor');
    const [tareas, setTareas] = useState<TareaDetail[]>([]);
    const [activeTaskIndex, setActiveTaskIndex] = useState(0);
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const [toasts, setToasts] = useState<{ id: string; title: string; description: string }[]>([]);
    const [isLineWrapping, setIsLineWrapping] = useState(true);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

    // Toast helper
    const showToast = (title: string, description: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, title, description }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const lastMarkdownRef = useRef(markdown);
    const saveTimeoutRef = useRef<any>(null);

    // Guardamos referencias para los handlers globales, cleanup y savingStatus
    const stateRef = useRef({ mode, markdown, isCreatingTask, savingStatus });
    stateRef.current = { mode, markdown, isCreatingTask, savingStatus };

    // Cargar la nota y sus tareas asociadas
    const cargarNotaYTareas = async () => {
        if (!notaId) return;
        const loadedNote = await db.obtenerNotaPorId(notaId);
        if (loadedNote) {
            setNote(loadedNote);
            setMarkdown(loadedNote.contenido);
            lastMarkdownRef.current = loadedNote.contenido;
            const loadedTareas = await db.obtenerTareasPorNota(notaId);
            loadedTareas.sort((a, b) => parseTaskDueDateToNumber(a.fechaEntrega) - parseTaskDueDateToNumber(b.fechaEntrega));
            setTareas(loadedTareas);
            
            // Cargar notas hermanas del mismo ambiente para el switcher
            const siblingNotes = await db.obtenerNotasPorCursoAmbiente(loadedNote.curso_id, loadedNote.ambiente_id);
            setNotesInEnv(siblingNotes);
        }
    };

    useEffect(() => {
        cargarNotaYTareas();
    }, [notaId]);

    // Alternar modos (Editor <-> Tareas)
    const toggleMode = () => {
        // Guardar inmediatamente si hay cambios sin guardar antes de cambiar a Tareas
        if (stateRef.current.savingStatus === 'unsaved') {
            persistChanges(lastMarkdownRef.current);
        }

        setMode(prev => {
            const next = prev === 'editor' ? 'tasks' : 'editor';
            // Enfocar correspondientemente tras el cambio
            if (next === 'editor') {
                setTimeout(() => {
                    (document.querySelector('.markdown-editor-codemirror .cm-content') as HTMLElement)?.focus();
                }, 100);
            } else {
                setTimeout(() => {
                    const cachedId = lastFocusedCache[`note-${notaId}`] || 'editor-task-0';
                    document.getElementById(cachedId)?.focus();
                }, 100);
            }
            return next;
        });
    };

    // Switcher para navegar entre notas (solo activo en modo editor)
    const switcher = useCtrlTabSwitcher({
        items: mode === 'editor' ? notesInEnv : [],
        onSelect: (nota) => {
            if (stateRef.current.savingStatus === 'unsaved') {
                db.sincronizarTareasDeNota(notaId, lastMarkdownRef.current);
            }
            navigateTo({
                type: 'editor',
                courseId: note?.curso_id || '',
                ambienteId: note?.ambiente_id || '',
                notaId: nota.id
            });
        }
    });

    // Guardar cambios a la base de datos de manera inmediata
    const persistChanges = async (content: string) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }
        setSavingStatus('saving');
        
        await db.sincronizarTareasDeNota(notaId, content);
        const loadedTareas = await db.obtenerTareasPorNota(notaId);
        loadedTareas.sort((a, b) => parseTaskDueDateToNumber(a.fechaEntrega) - parseTaskDueDateToNumber(b.fechaEntrega));
        setTareas(loadedTareas);
        
        // Actualizar el título local de la nota
        const loadedNote = await db.obtenerNotaPorId(notaId);
        if (loadedNote) {
            setNote(loadedNote);
        }
        
        setSavingStatus('saved');
    };

    // Guardar cambios del Markdown (local y en cola de autoguardado a 1 minuto)
    const handleMarkdownChange = async (newVal: string) => {
        const processedVal = replaceLatexAccents(newVal);
        setMarkdown(processedVal);
        lastMarkdownRef.current = processedVal;
        setSavingStatus('unsaved');
        
        // Temporizador de 1 minuto para autoguardado (Debounce)
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            persistChanges(lastMarkdownRef.current);
        }, 60000);
    };

    // Agregar tarea inyectándola al final del Markdown de la nota
    const handleAgregarTarea = async (descripcion: string, fechaEntrega: string) => {
        const cleanMarkdown = markdown.trimEnd();
        const dateSuffix = fechaEntrega ? ` @${fechaEntrega}` : '';
        const taskLine = `\n:Tarea [ ] ${descripcion}${dateSuffix}`;
        const newMarkdown = `${cleanMarkdown}${taskLine}\n`;
        
        setMarkdown(newMarkdown);
        lastMarkdownRef.current = newMarkdown;
        await persistChanges(newMarkdown);
        setIsCreatingTask(false);
        showToast("TAREA CREADA", descripcion);
        
        // Enfocar la tarea agregada (que es la última de la lista)
        setTimeout(() => {
            const lastIndex = tareas.length + 1; // la nueva tarea estará al final (índice 0 es el botón de creación)
            setActiveTaskIndex(lastIndex);
            const elementId = `editor-task-${lastIndex}`;
            document.getElementById(elementId)?.focus();
        }, 150);
    };

    // Cambiar el estado de una tarea y sincronizarlo al Markdown de forma inmediata
    const toggleTaskStatus = async (task: TareaDetail) => {
        let nuevoEstado: 'incomplete' | 'in_progress' | 'completed';
        let actionTitle = '';
        const shortDesc = task.descripcion.length > 25 ? task.descripcion.substring(0, 25) + '...' : task.descripcion;
        
        if (task.estado === 'incomplete') {
            nuevoEstado = 'in_progress';
            actionTitle = "TAREA INICIADA";
        } else if (task.estado === 'in_progress') {
            nuevoEstado = 'completed';
            actionTitle = "TAREA COMPLETADA";
        } else {
            nuevoEstado = 'incomplete';
            actionTitle = "TAREA PENDIENTE";
        }

        const newMarkdown = updateTaskStateInMarkdown(markdown, task.descripcion, nuevoEstado);
        setMarkdown(newMarkdown);
        lastMarkdownRef.current = newMarkdown;
        await persistChanges(newMarkdown);
        showToast(actionTitle, shortDesc);
    };

    const handleBack = () => {
        if (stateRef.current.savingStatus === 'unsaved') {
            persistChanges(lastMarkdownRef.current);
        }
        onBack();
    };

    const handleEliminarNotaConfirmado = async () => {
        if (!note) return;
        try {
            await db.eliminarNota(note.id);
            onBack();
        } catch (e) {
            console.error('Error al eliminar nota desde editor:', e);
        }
    };

    // Atajos de teclado para la vista del editor
    useEffect(() => {
        ShortcutManager.registerGroup('noteEditorView', [
            // Alt + Tab: Alternar vistas
            { 
                code: 'Tab', 
                altKey: true, 
                action: (e) => { 
                    e.preventDefault(); 
                    toggleMode(); 
                },
                description: 'Alternar entre editor y tareas asociadas'
            },
            { 
                code: 'KeyM', 
                altKey: true, 
                action: (e) => { 
                    e.preventDefault(); 
                    toggleMode(); 
                },
                description: 'Alternar entre editor y tareas asociadas'
            },

            // Ctrl + K: Eliminar la nota actual
            {
                code: 'KeyK',
                ctrlKey: true,
                action: (e) => {
                    e.preventDefault();
                    setIsConfirmDeleteOpen(true);
                },
                description: 'Eliminar la nota actual'
            },

            // Escape o Alt + Left: Regresar
            { 
                code: 'Escape', 
                action: (e) => { 
                    // Si se está editando una tarea en modal, no cerrar la vista
                    if (stateRef.current.isCreatingTask) return;
                    e.preventDefault(); 
                    handleBack(); 
                },
                description: 'Regresar a la pantalla anterior (guardando cambios)'
            },
            { 
                code: 'ArrowLeft', 
                altKey: true, 
                action: (e) => { 
                    e.preventDefault(); 
                    handleBack(); 
                },
                description: 'Regresar a la pantalla anterior (guardando cambios)'
            },
            // Ctrl + N: Solo en modo Tareas para inyectar tarea
            {
                code: 'KeyN',
                ctrlKey: true,
                action: (e) => {
                    if (stateRef.current.mode === 'tasks') {
                        e.preventDefault();
                        setIsCreatingTask(true);
                    }
                },
                description: 'Crear nueva tarea (solo en modo tareas)'
            },
            // Ctrl + S: Guardar cambios inmediatamente
            {
                code: 'KeyS',
                ctrlKey: true,
                action: (e) => {
                    e.preventDefault();
                    persistChanges(lastMarkdownRef.current);
                    showToast("NOTA GUARDADA", "Los cambios han sido guardados manualmente.");
                },
                description: 'Guardar cambios inmediatamente'
            },
            // Alt + Z: Alternar ajuste de línea (Word Wrap)
            {
                code: 'KeyZ',
                altKey: true,
                action: (e) => {
                    e.preventDefault();
                    setIsLineWrapping(prev => {
                        const next = !prev;
                        showToast("AJUSTE DE LÍNEA", next ? "ACTIVADO (WORD WRAP)" : "DESACTIVADO (SIN AJUSTE)");
                        return next;
                    });
                },
                description: 'Activar/Desactivar ajuste automático de línea (Word Wrap)'
            }
        ]);

        return () => {
            ShortcutManager.unregisterGroup('noteEditorView');
        };
    }, [onBack, markdown, mode, note]);

    // Cleanup y guardado forzado al desmontar
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            if (stateRef.current.savingStatus === 'unsaved') {
                db.sincronizarTareasDeNota(notaId, lastMarkdownRef.current);
            }
        };
    }, [notaId]);

    // Restaurar foco al montar o al cambiar de modo
    useEffect(() => {
        if (!note) return;
        const timer = setTimeout(() => {
            if (stateRef.current.mode === 'editor') {
                (document.querySelector('.markdown-editor-codemirror .cm-content') as HTMLElement)?.focus();
            } else {
                const cachedId = lastFocusedCache[`note-${notaId}`] || 'editor-task-0';
                document.getElementById(cachedId)?.focus();
            }
        }, 50);
        return () => clearTimeout(timer);
    }, [note?.id, mode, tareas]);

    // Guardar foco en el caché para restablecer
    const handleElementFocus = (id: string) => {
        lastFocusedCache[`note-${notaId}`] = id;
    };

    return {
        note,
        markdown,
        mode,
        setMode,
        toggleMode,
        tareas,
        activeTaskIndex,
        setActiveTaskIndex,
        isCreatingTask,
        setIsCreatingTask,
        handleMarkdownChange,
        handleAgregarTarea,
        toggleTaskStatus,
        handleElementFocus,
        savingStatus,
        toasts,
        handleBack,
        switcher,
        notesInEnv,
        isLineWrapping,
        isConfirmDeleteOpen,
        setIsConfirmDeleteOpen,
        handleEliminarNotaConfirmado
    };
}
