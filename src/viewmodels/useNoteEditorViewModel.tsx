// Ruta: src/viewmodels/useNoteEditorViewModel.tsx
import { useState, useEffect, useRef } from 'react';
import { ShortcutManager } from '../keyboard/ShortcutManager';
import { db, TareaDetail, Nota, updateTaskStateInMarkdown } from '../services/database';

const lastFocusedCache: Record<string, string> = {};

export function useNoteEditorViewModel(
    notaId: string,
    onBack: () => void
) {
    const [note, setNote] = useState<Nota | null>(null);
    const [markdown, setMarkdown] = useState('');
    const [mode, setMode] = useState<'editor' | 'tasks'>('editor');
    const [tareas, setTareas] = useState<TareaDetail[]>([]);
    const [activeTaskIndex, setActiveTaskIndex] = useState(0);
    const [isCreatingTask, setIsCreatingTask] = useState(false);

    // Guardamos referencias para los handlers globales
    const stateRef = useRef({ mode, markdown, isCreatingTask });
    stateRef.current = { mode, markdown, isCreatingTask };

    // Cargar la nota y sus tareas asociadas
    const cargarNotaYTareas = async () => {
        if (!notaId) return;
        const loadedNote = await db.obtenerNotaPorId(notaId);
        if (loadedNote) {
            setNote(loadedNote);
            setMarkdown(loadedNote.contenido);
            const loadedTareas = await db.obtenerTareasPorNota(notaId);
            setTareas(loadedTareas);
        }
    };

    useEffect(() => {
        cargarNotaYTareas();
    }, [notaId]);

    // Alternar modos (Editor <-> Tareas)
    const toggleMode = () => {
        setMode(prev => {
            const next = prev === 'editor' ? 'tasks' : 'editor';
            // Enfocar correspondientemente tras el cambio
            if (next === 'editor') {
                setTimeout(() => {
                    document.getElementById('markdown-editor')?.focus();
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

    // Guardar cambios del Markdown e indexar tareas
    const handleMarkdownChange = async (newVal: string) => {
        setMarkdown(newVal);
        await db.sincronizarTareasDeNota(notaId, newVal);
        const loadedTareas = await db.obtenerTareasPorNota(notaId);
        setTareas(loadedTareas);
        
        // Actualizar el título local de la nota
        const loadedNote = await db.obtenerNotaPorId(notaId);
        if (loadedNote) {
            setNote(loadedNote);
        }
    };

    // Agregar tarea inyectándola al final del Markdown de la nota
    const handleAgregarTarea = async (descripcion: string, fechaEntrega: string) => {
        const cleanMarkdown = markdown.trimEnd();
        const dateSuffix = fechaEntrega ? ` @${fechaEntrega}` : '';
        const taskLine = `\n:Tarea [ ] ${descripcion}${dateSuffix}`;
        const newMarkdown = `${cleanMarkdown}${taskLine}\n`;
        
        await handleMarkdownChange(newMarkdown);
        setIsCreatingTask(false);
        
        // Enfocar la tarea agregada (que es la última de la lista)
        setTimeout(() => {
            const lastIndex = tareas.length; // la nueva tarea estará al final
            setActiveTaskIndex(lastIndex);
            const elementId = `editor-task-${lastIndex}`;
            document.getElementById(elementId)?.focus();
        }, 150);
    };

    // Cambiar el estado de una tarea y sincronizarlo al Markdown
    const toggleTaskStatus = async (task: TareaDetail) => {
        let nuevoEstado: 'incomplete' | 'in_progress' | 'completed';
        if (task.estado === 'incomplete') {
            nuevoEstado = 'in_progress';
        } else if (task.estado === 'in_progress') {
            nuevoEstado = 'completed';
        } else {
            nuevoEstado = 'incomplete';
        }

        const newMarkdown = updateTaskStateInMarkdown(markdown, task.descripcion, nuevoEstado);
        await handleMarkdownChange(newMarkdown);
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
                } 
            },
            // Escape o Alt + Left: Regresar
            { 
                code: 'Escape', 
                action: (e) => { 
                    // Si se está editando una tarea en modal, no cerrar la vista
                    if (stateRef.current.isCreatingTask) return;
                    e.preventDefault(); 
                    onBack(); 
                } 
            },
            { 
                code: 'ArrowLeft', 
                altKey: true, 
                action: (e) => { 
                    e.preventDefault(); 
                    onBack(); 
                } 
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
                }
            }
        ]);

        return () => {
            ShortcutManager.unregisterGroup('noteEditorView');
        };
    }, [onBack, markdown, mode, note]);

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
        handleElementFocus
    };
}
