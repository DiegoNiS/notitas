// Ruta: src/viewmodels/useDashboardViewModel.tsx
import { useState, useEffect } from 'react';
import { ShortcutManager } from '../keyboard/ShortcutManager';
import { useKeysHeld } from '../keyboard/useKeysHeld';
import { db, CursoDetalle } from '../services/database';
import { ShortcutConfig } from '../keyboard/types';
import { useCtrlTabSwitcher } from '../keyboard/useCtrlTabSwitcher';

export function useDashboardViewModel(
  cursos: CursoDetalle[],
  onSelectCurso: (cursoId: string) => void,
  onRecargar: () => void
) {
  const isAltShiftPressed = useKeysHeld({ alt: true, shift: true });

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Filtrar los cursos según la pestaña activa
  const filteredCursos = activeTab === 'active' 
    ? cursos.filter(c => c.archivado === 0) 
    : cursos.filter(c => c.archivado === 1);

  const switcher = useCtrlTabSwitcher({
    items: filteredCursos,
    onSelect: (curso) => onSelectCurso(curso.id)
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [cursoAEditar, setCursoAEditar] = useState<CursoDetalle | null>(null);

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [cursoAEliminar, setCursoAEliminar] = useState<CursoDetalle | null>(null);

  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionAnchor, setSelectionAnchor] = useState<number | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuOptionIndex, setMenuOptionIndex] = useState(0);

  // Resetear estados al cambiar de pestaña
  useEffect(() => {
    setFocusedIndex(-1);
    setSelectedIds(new Set());
    setSelectionAnchor(null);
    setIsMenuOpen(false);
  }, [activeTab]);

  // Obtener opciones dinámicas del menú
  const getOpcionesMenu = (): string[] => {
    const curso = filteredCursos[focusedIndex];
    if (curso && curso.archivado === 1) {
      return ['Editar', 'Desarchivar', 'Eliminar'];
    }
    return ['Editar', 'Archivar', 'Eliminar'];
  };

  const OPCIONES_MENU = getOpcionesMenu();

  const handleEjecutarOpcion = async () => {
    const curso = filteredCursos[focusedIndex];
    if (!curso) return;

    const opcion = OPCIONES_MENU[menuOptionIndex];
    if (opcion === 'Editar') {
      setCursoAEditar(curso);
      setIsEditModalOpen(true);
    } else if (opcion === 'Archivar') {
      try {
        await db.archivarCurso(curso.id, true);
        onRecargar();
      } catch (e) {
        console.error('Error al archivar curso:', e);
      }
    } else if (opcion === 'Desarchivar') {
      try {
        await db.archivarCurso(curso.id, false);
        onRecargar();
      } catch (e) {
        console.error('Error al desarchivar curso:', e);
      }
    } else if (opcion === 'Eliminar') {
      setCursoAEliminar(curso);
      setIsConfirmDeleteOpen(true);
    }
    setIsMenuOpen(false);
  };

  const handleEliminarCursoConfirmado = async () => {
    if (!cursoAEliminar) return;
    try {
      await db.eliminarCurso(cursoAEliminar.id);
      setCursoAEliminar(null);
      onRecargar();
    } catch (e) {
      console.error('Error al eliminar curso:', e);
    }
  };

  useEffect(() => {
    const shortcuts: ShortcutConfig[] = [
      // 1. Abrir Modal de Creación con Ctrl + N
      {
        code: 'KeyN',
        ctrlKey: true,
        action: (e) => {
          e.preventDefault();
          setIsModalOpen(true);
        },
        description: 'Crear un nuevo curso'
      },
      // 2. Foco rápido con Alt + Shift + Número [1-9]
      {
        codeMatcher: (code) => code.startsWith('Digit') || code.startsWith('Numpad'),
        altKey: true,
        shiftKey: true,
        action: (e) => {
          e.preventDefault();
          const num = parseInt(e.code.replace('Digit', '').replace('Numpad', ''), 10);
          if (num - 1 >= 0 && num - 1 < filteredCursos.length) {
            setFocusedIndex(num - 1);
          }
        },
        description: 'Enfocar un curso rápidamente',
        keyDisplay: 'Alt + Shift + [1-9]'
      }
    ];

    if (isMenuOpen) {
      // Atajos activos únicamente cuando el menú Spotlight (Ctrl + K) está abierto
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
      // Atajos activos en navegación normal del Dashboard
      shortcuts.push(
        {
          code: 'KeyK',
          ctrlKey: true,
          action: (e) => {
            e.preventDefault();
            if (focusedIndex >= 0) {
              setMenuOptionIndex(0);
              setIsMenuOpen(true);
            }
          },
          description: 'Abrir menú de opciones para el curso enfocado'
        },
        {
          code: 'ArrowLeft',
          action: (e) => {
            e.preventDefault();
            setActiveTab('active');
          },
          description: 'Cambiar a la pestaña de Cursos Activos'
        },
        {
          code: 'ArrowRight',
          action: (e) => {
            e.preventDefault();
            setActiveTab('archived');
          },
          description: 'Cambiar a la pestaña de Cursos Archivados'
        },
        {
          codeMatcher: (code) => code === 'ArrowDown' || code === 'ArrowUp',
          action: (e) => {
            e.preventDefault();
            if (selectedIds.size > 0) {
              setSelectedIds(new Set());
              setSelectionAnchor(null);
            }
            if (e.code === 'ArrowDown') {
              setFocusedIndex(prev => Math.min(prev + 1, filteredCursos.length - 1));
            } else {
              setFocusedIndex(prev => Math.max(prev - 1, -1));
            }
          },
          description: 'Mover el foco arriba/abajo por la lista',
          keyDisplay: '↑ / ↓'
        },
        {
          codeMatcher: (code) => code === 'ArrowDown' || code === 'ArrowUp',
          ctrlKey: true,
          shiftKey: true,
          action: (e) => {
            e.preventDefault();
            const currentAnchor = selectionAnchor !== null ? selectionAnchor : (focusedIndex >= 0 ? focusedIndex : 0);
            setSelectionAnchor(currentAnchor);
            const newFocus = e.code === 'ArrowDown' 
              ? Math.min(focusedIndex + 1, filteredCursos.length - 1) 
              : Math.max(focusedIndex - 1, 0);
            setFocusedIndex(newFocus);
            
            const newSelected = new Set<string>();
            for (let i = Math.min(currentAnchor, newFocus); i <= Math.max(currentAnchor, newFocus); i++) {
              newSelected.add(filteredCursos[i].id);
            }
            setSelectedIds(newSelected);
          },
          description: 'Selección múltiple de cursos',
          keyDisplay: 'Ctrl + Shift + ↑/↓'
        },
        {
          code: 'Enter',
          action: (e) => {
            e.preventDefault();
            if (focusedIndex === -1) {
              setIsModalOpen(true);
            } else if (focusedIndex >= 0) {
              onSelectCurso(filteredCursos[focusedIndex].id);
            }
          },
          description: 'Abrir el curso enfocado'
        }
      );
    }

    ShortcutManager.registerGroup('dashboard', shortcuts);

    return () => {
      ShortcutManager.unregisterGroup('dashboard');
    };
  }, [filteredCursos, focusedIndex, selectedIds, selectionAnchor, isMenuOpen, menuOptionIndex, onSelectCurso, activeTab]);

  return {
    isAltShiftPressed,
    isModalOpen,
    setIsModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    cursoAEditar,
    setCursoAEditar,
    isConfirmDeleteOpen,
    setIsConfirmDeleteOpen,
    cursoAEliminar,
    setCursoAEliminar,
    focusedIndex,
    setFocusedIndex,
    selectedIds,
    setSelectedIds,
    selectionAnchor,
    setSelectionAnchor,
    isMenuOpen,
    setIsMenuOpen,
    menuOptionIndex,
    setMenuOptionIndex,
    OPCIONES_MENU,
    switcher,
    activeTab,
    setActiveTab,
    filteredCursos,
    handleEliminarCursoConfirmado
  };
}
