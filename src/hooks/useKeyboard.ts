// Ruta: src/hooks/useKeyboard.ts
import { useState, useEffect } from 'react';

export function useKeyboardModifiers() {
  const [isAltShiftPressed, setIsAltShiftPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si ambas teclas están presionadas, activamos el estado
      if (e.altKey && e.shiftKey) {
        setIsAltShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Si soltamos ALGUNA de las dos, desactivamos el estado
      if (!e.altKey || !e.shiftKey) {
        setIsAltShiftPressed(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return { isAltShiftPressed };
}