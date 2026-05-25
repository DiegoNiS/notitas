// Ruta: src/components/Sidebar.tsx
import { useEffect } from 'react';
import { useKeysHeld } from '../keyboard/useKeysHeld'; // <-- Hook generalizado
import { ShortcutManager } from '../keyboard/ShortcutManager'; // <-- Manager central
import { CursoDetalle } from '../services/database';

interface SidebarProps {
  isOpen: boolean;
  cursos: CursoDetalle[];
  onSelectCurso: (id: string) => void;
}

export function Sidebar({ isOpen, cursos, onSelectCurso }: SidebarProps) {
  // 1. Usamos el Hook genérico pidiendo exactamente lo que necesitamos
  const isAltShiftPressed = useKeysHeld({ alt: true, shift: true });

  // 2. Usamos el ShortcutManager en lugar de listeners crudos
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