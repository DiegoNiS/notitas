// Ruta: src/viewmodels/useDashboardViewModel.ts
import { useState, useEffect } from 'react';
import { ShortcutManager } from '../keyboard/ShortcutManager';
import { useKeysHeld } from '../keyboard/useKeysHeld';
import { CursoDetalle } from '../services/database';
import { ShortcutConfig } from '../keyboard/types';

export function useDashboardViewModel(
  cursos: CursoDetalle[],
  onRecargar: () => void,
  onSelectCurso: (cursoId: string) => void
) {
  const isAltShiftPressed = useKeysHeld({ alt: true, shift: true });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionAnchor, setSelectionAnchor] = useState<number | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuOptionIndex, setMenuOptionIndex] = useState(0);
  const OPCIONES_MENU = ['Editar', 'Archivar', 'Eliminar'];

  useEffect(() => {
    const shortcuts: ShortcutConfig[] = [
      // 1. Abrir Modal de Creación con Ctrl + N
      {
        code: 'KeyN',
        ctrlKey: true,
        action: (e) => {
          e.preventDefault();
          setIsModalOpen(true);
        }
      },
      // 2. Foco rápido con Alt + Shift + Número [1-9]
      {
        codeMatcher: (code) => code.startsWith('Digit') || code.startsWith('Numpad'),
        altKey: true,
        shiftKey: true,
        action: (e) => {
          e.preventDefault();
          const num = parseInt(e.code.replace('Digit', '').replace('Numpad', ''), 10);
          if (num - 1 >= 0 && num - 1 < cursos.length) {
            setFocusedIndex(num - 1);
          }
        }
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
          }
        },
        {
          code: 'ArrowDown',
          action: (e) => {
            e.preventDefault();
            setMenuOptionIndex(prev => Math.min(prev + 1, OPCIONES_MENU.length - 1));
          }
        },
        {
          code: 'ArrowUp',
          action: (e) => {
            e.preventDefault();
            setMenuOptionIndex(prev => Math.max(prev - 1, 0));
          }
        },
        {
          code: 'Enter',
          action: (e) => {
            e.preventDefault();
            console.log(`Acción: ${OPCIONES_MENU[menuOptionIndex]} en ${cursos[focusedIndex]?.abreviatura}`);
            setIsMenuOpen(false);
          }
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
          }
        },
        {
          codeMatcher: (code) => code === 'ArrowRight' || code === 'ArrowLeft',
          action: (e) => {
            e.preventDefault();
            if (selectedIds.size > 0) {
              setSelectedIds(new Set());
              setSelectionAnchor(null);
            }
            if (e.code === 'ArrowRight') {
              setFocusedIndex(prev => Math.min(prev + 1, cursos.length - 1));
            } else {
              setFocusedIndex(prev => Math.max(prev - 1, -1));
            }
          }
        },
        {
          codeMatcher: (code) => code === 'ArrowRight' || code === 'ArrowLeft',
          ctrlKey: true,
          shiftKey: true,
          action: (e) => {
            e.preventDefault();
            const currentAnchor = selectionAnchor !== null ? selectionAnchor : (focusedIndex >= 0 ? focusedIndex : 0);
            setSelectionAnchor(currentAnchor);
            const newFocus = e.code === 'ArrowRight' 
              ? Math.min(focusedIndex + 1, cursos.length - 1) 
              : Math.max(focusedIndex - 1, 0);
            setFocusedIndex(newFocus);
            
            const newSelected = new Set<string>();
            for (let i = Math.min(currentAnchor, newFocus); i <= Math.max(currentAnchor, newFocus); i++) {
              newSelected.add(cursos[i].id);
            }
            setSelectedIds(newSelected);
          }
        },
        {
          code: 'Enter',
          action: (e) => {
            e.preventDefault();
            if (focusedIndex === -1) {
              setIsModalOpen(true);
            } else if (focusedIndex >= 0) {
              onSelectCurso(cursos[focusedIndex].id);
            }
          }
        }
      );
    }

    ShortcutManager.registerGroup('dashboard', shortcuts);

    return () => {
      ShortcutManager.unregisterGroup('dashboard');
    };
  }, [cursos, focusedIndex, selectedIds, selectionAnchor, isMenuOpen, menuOptionIndex, onSelectCurso]);

  return {
    isAltShiftPressed,
    isModalOpen,
    setIsModalOpen,
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
    OPCIONES_MENU
  };
}
