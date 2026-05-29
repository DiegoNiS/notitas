// Ruta: src/components/composite/Sidebar.tsx
import { useEffect, useRef } from 'react';
import { useKeysHeld } from '../../keyboard/useKeysHeld';
import { ShortcutManager } from '../../keyboard/ShortcutManager';
import { CursoDetalle } from '../../services/database';
import { useOverlay } from '../../context/OverlayContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cursos: CursoDetalle[];
  onSelectCurso: (id: string) => void;
}

export function Sidebar({ isOpen, onClose, cursos, onSelectCurso }: SidebarProps) {
  const isAltShiftPressed = useKeysHeld({ alt: true, shift: true });
  const { showOverlay, hideOverlay } = useOverlay();

  // Guardamos la última función onClose en un ref para evitar que cambie la dependencia del effect
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Controlar de forma autónoma el overlay difuminado
  useEffect(() => {
    if (isOpen) {
      const stableOnClose = () => {
        if (onCloseRef.current) {
          onCloseRef.current();
        }
      };

      // Registramos la capa del fondo con zIndex 5
      const success = showOverlay(5, stableOnClose);
      if (!success) {
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
  }, [isOpen]);

  // Usamos el ShortcutManager en lugar de listeners crudos
  useEffect(() => {
    if (!isOpen) return;
    
    ShortcutManager.registerGroup('sidebar', [
      {
        codeMatcher: (code) => code.startsWith('Digit') || code.startsWith('Numpad'),
        altKey: true, 
        shiftKey: true,
        action: (e) => {
          const numero = parseInt(e.code.replace('Digit', '').replace('Numpad', ''), 10);
          const index = numero - 1;
          if (index >= 0 && index < cursos.length) {
            onSelectCurso(cursos[index].id); 
          }
        }
      },
      {
        code: 'Escape',
        action: () => onClose()
      }
    ]);

    return () => ShortcutManager.unregisterGroup('sidebar');
  }, [isOpen, cursos, onSelectCurso]);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-content">
        
        <div className="sidebar-brand">
          <div className="shape-square"></div>
          <span className="brand-text">Notitas</span>
        </div>

        <div className="course-list">
          {cursos.map((curso, index) => (
            <div key={curso.id} className="course-item">
              <div className="course-header" title={curso.nombre}>
                
                {/* Indicador visual dependiente del estado del teclado */}
                {isOpen && isAltShiftPressed && (
                  <div className="shortcut-hint">{index + 1}</div>
                )}
                
                <div className="course-abbr">{curso.abreviatura}</div>
                <div className="course-name">{curso.nombre}</div>
              </div>

              <div className="ambiente-list">
                {curso.ambientes.map((ambiente) => (
                  <div key={ambiente} className="ambiente-item">
                    {ambiente}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}