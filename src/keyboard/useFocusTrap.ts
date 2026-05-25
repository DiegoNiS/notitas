// Ruta: src/hooks/useFocusTrap.ts
import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !modalRef.current) return;

    const modalElement = modalRef.current;
    
    // Encuentra todos los elementos interactivos dentro del modal
    const focusableElements = modalElement.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Interceptamos la tecla Tab
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) { // Shift + Tab (Ir hacia atrás)
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault(); // Evitamos que salga del modal
        }
      } else { // Tab normal (Ir hacia adelante)
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault(); // Volvemos al inicio del modal
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isActive]);

  return modalRef; // Devolvemos la referencia para ponérsela a nuestro modal
}