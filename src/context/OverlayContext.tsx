// Ruta: src/context/OverlayContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface OverlayConfig {
  zIndex: number;
  onClose?: () => void;
}

interface OverlayContextType {
  isOverlayActive: boolean;
  showOverlay: (zIndex: number, onClose?: () => void) => boolean;
  hideOverlay: () => void;
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig | null>(null);

  const showOverlay = (zIndex: number, onClose?: () => void): boolean => {
    // Guardián de concurrencia: si ya hay un overlay activo, bloqueamos la solicitud
    if (overlayConfig !== null) {
      console.warn(`[OverlayContext] Bloqueada solicitud de overlay con zIndex ${zIndex}. Ya hay uno activo con zIndex ${overlayConfig.zIndex}.`);
      return false;
    }
    setOverlayConfig({ zIndex, onClose });
    return true;
  };

  const hideOverlay = () => {
    setOverlayConfig(null);
  };

  const isOverlayActive = overlayConfig !== null;

  return (
    <OverlayContext.Provider value={{ isOverlayActive, showOverlay, hideOverlay }}>
      {children}
      {overlayConfig && (
        <div 
          className="global-overlay" // Reutiliza la clase con difuminado y animación
          onClick={() => {
            if (overlayConfig.onClose) {
              overlayConfig.onClose();
            }
            hideOverlay();
          }}
          style={{ 
            zIndex: overlayConfig.zIndex,
            // Sobrescribimos el display para que solo actúe como fondo y no intente centrar nada
            display: 'block'
          }} 
        />
      )}
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error('useOverlay debe usarse dentro de un OverlayProvider');
  }
  return context;
}
