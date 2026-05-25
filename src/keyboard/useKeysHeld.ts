// Ruta: src/keyboard/useKeysHeld.ts
import { useState, useEffect } from 'react';

// Configuramos qué teclas queremos observar simultáneamente
interface KeysToWatch {
  alt?: boolean;
  ctrl?: boolean;
  shift?: boolean;
}

/**
 * Hook genérico que devuelve true mientras se mantengan presionadas las teclas indicadas.
 */
export function useKeysHeld(targetKeys: KeysToWatch) {
  const [isHeld, setIsHeld] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Verificamos si el estado actual del teclado coincide con lo que pedimos vigilar
      const matchAlt = targetKeys.alt ? e.altKey : true;
      const matchCtrl = targetKeys.ctrl ? e.ctrlKey : true;
      const matchShift = targetKeys.shift ? e.shiftKey : true;

      // Si todo coincide, encendemos el estado
      if (matchAlt && matchCtrl && matchShift) {
        setIsHeld(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Si soltamos ALGUNA de las teclas objetivo, apagamos el estado
      if (
        (targetKeys.alt && !e.altKey) ||
        (targetKeys.ctrl && !e.ctrlKey) ||
        (targetKeys.shift && !e.shiftKey)
      ) {
        setIsHeld(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [targetKeys.alt, targetKeys.ctrl, targetKeys.shift]); // Dependencias limpias

  return isHeld;
}