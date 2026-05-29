// Ruta: src/components/core/GlobalOverlay.tsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOverlay } from '../../context/OverlayContext';

interface GlobalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  zIndex?: number;
}

export function GlobalOverlay({ isOpen, onClose, children, zIndex = 9999 }: GlobalOverlayProps) {
  const { showOverlay, hideOverlay } = useOverlay();

  // Guardamos la última función onClose en un ref para evitar que cambie la dependencia del effect
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Registrar el overlay en el contexto y aplicar el guardián de concurrencia
  useEffect(() => {
    if (isOpen) {
      // Pasamos una función estable que llama al ref actual
      const stableOnClose = () => {
        if (onCloseRef.current) {
          onCloseRef.current();
        }
      };

      // Registramos el fondo en zIndex - 1 (debajo del contenido de la modal)
      const success = showOverlay(zIndex - 1, stableOnClose);
      if (!success) {
        // Si el guardián rechaza la apertura (ya hay un overlay activo), cancelamos
        if (onCloseRef.current) {
          onCloseRef.current();
        }
      }
    }

    return () => {
      if (isOpen) {
        hideOverlay();
      }
    };
  }, [isOpen, zIndex]);

  // Lógica global para cerrar la modal con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.stopImmediatePropagation(); // Detiene propagación para que no viaje a otros escuchadores
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc, { capture: true });
    return () => document.removeEventListener('keydown', handleEsc, { capture: true });
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Renderizamos únicamente el contenido en primer plano.
  // El fondo difuminado oscuro es dibujado de forma centralizada por el OverlayProvider.
  const modalWrapper = (
    <div 
      style={{ 
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: zIndex,
        pointerEvents: 'none' // Deja que los clics en áreas vacías traspasen al fondo global
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} // Evita que clics dentro del modal disparen el cierre
        style={{ pointerEvents: 'auto', display: 'contents' }}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modalWrapper, document.body);
}