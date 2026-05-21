// Ruta: src/components/GlobalOverlay.tsx
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface GlobalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode; // Lo que sea que queramos poner dentro (un Form, un menú, etc.)
  zIndex?: number; // Por si necesitamos un overlay encima de otro overlay
}

export function GlobalOverlay({ isOpen, onClose, children, zIndex = 9999 }: GlobalOverlayProps) {
  
  // Lógica global e infalible para cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.stopImmediatePropagation(); // Matamos el evento aquí para que no viaje a App.tsx
        onClose();
      }
    };
    // capture: true lo intercepta antes que cualquier otro componente
    document.addEventListener('keydown', handleEsc, { capture: true });
    return () => document.removeEventListener('keydown', handleEsc, { capture: true });
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const overlayContent = (
    <div 
      className="global-overlay" 
      style={{ zIndex }} 
      onClick={onClose} // Clic en el fondo oscuro = cerrar
    >
      {/* Si le pasamos contenido (ej. un formulario), evitamos que el clic en el formulario cierre el overlay */}
      {children && (
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'contents' }}>
          {children}
        </div>
      )}
    </div>
  );

  return createPortal(overlayContent, document.body);
}