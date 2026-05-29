// Ruta: src/keyboard/useCtrlTabSwitcher.ts
import { useState, useEffect, useRef } from 'react';
import { useOverlay } from '../context/OverlayContext';

interface UseCtrlTabSwitcherParams<T> {
  items: T[];
  onSelect: (item: T) => void;
}

export function useCtrlTabSwitcher<T>({ items, onSelect }: UseCtrlTabSwitcherParams<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { isOverlayActive } = useOverlay();

  // Guardamos las referencias en un useRef para evitar volver a registrar
  // escuchadores globales en cada cambio de estado (selectedIndex, isOpen, items)
  const stateRef = useRef({ isOpen, selectedIndex, items, onSelect });
  stateRef.current = { isOpen, selectedIndex, items, onSelect };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { items: currentItems, isOpen: open } = stateRef.current;
      if (currentItems.length === 0) return;

      // Escuchamos Ctrl + Tab
      if (e.ctrlKey && e.code === 'Tab') {
        e.preventDefault();
        e.stopImmediatePropagation();

        const len = currentItems.length;

        if (!open) {
          // Guardián de concurrencia: si ya hay un overlay activo, no hacemos nada
          if (isOverlayActive) return;
          
          setIsOpen(true);
          // Al abrir, seleccionamos el segundo elemento (index 1) si hay más de uno (comportamiento Alt+Tab)
          const initialIndex = e.shiftKey
            ? (len - 1) % len
            : (len > 1 ? 1 : 0);
          setSelectedIndex(initialIndex);
        } else {
          // Si ya está abierto, cicla en la lista
          if (e.shiftKey) {
            setSelectedIndex(prev => (prev - 1 + len) % len);
          } else {
            setSelectedIndex(prev => (prev + 1) % len);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const { items: currentItems, isOpen: open, selectedIndex: currentIndex, onSelect: currentSelect } = stateRef.current;

      // Al soltar Control, confirmamos la navegación y cerramos
      if (e.key === 'Control' && open) {
        e.preventDefault();
        
        if (currentItems[currentIndex]) {
          currentSelect(currentItems[currentIndex]);
        }
        
        setIsOpen(false);
        setSelectedIndex(0);
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keyup', handleKeyUp, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, [isOverlayActive]);

  return {
    isOpen,
    selectedIndex,
    close: () => {
      setIsOpen(false);
      setSelectedIndex(0);
    }
  };
}
