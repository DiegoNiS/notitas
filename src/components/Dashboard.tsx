import { useEffect, useState } from 'react';
import { GlobalOverlay } from './GlobalOverlay';
import { useKeyboardModifiers } from '../hooks/useKeyboard';
import { NewCourseModal } from './NewCourseModal';
import { CursoDetalle } from '../services/database';

interface DashboardProps {
  cursos: CursoDetalle[];
  onRecargar: () => void;
  onSelectCurso: (cursoId: string) => void;
}

export function Dashboard({ cursos, onRecargar, onSelectCurso }: DashboardProps) {
  const { isAltShiftPressed } = useKeyboardModifiers();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [focusedIndex, setFocusedIndex] = useState<number>(-1); 
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionAnchor, setSelectionAnchor] = useState<number | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuOptionIndex, setMenuOptionIndex] = useState(0);
  const OPCIONES_MENU = ['Editar', 'Archivar', 'Eliminar'];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      
      if (isMenuOpen) {
        e.preventDefault();
        // FIX 2: ¡Matamos el evento aquí! Evita que App.tsx escuche el ArrowUp y nos mande al Welcome
        e.stopImmediatePropagation(); 

        if (e.code === 'Escape') {
          setIsMenuOpen(false);
        } else if (e.code === 'ArrowDown') {
          setMenuOptionIndex(prev => Math.min(prev + 1, OPCIONES_MENU.length - 1));
        } else if (e.code === 'ArrowUp') {
          setMenuOptionIndex(prev => Math.max(prev - 1, 0));
        } else if (e.code === 'Enter') {
          console.log(`Acción: ${OPCIONES_MENU[menuOptionIndex]} en ${cursos[focusedIndex].abreviatura}`);
          setIsMenuOpen(false);
        }
        return; 
      }

      // ... (Ctrl+N, Alt+Shift se mantienen igual)
      if (e.ctrlKey && e.code === 'KeyN') {
        e.preventDefault(); setIsModalOpen(true); return;
      }
      const isNumberKey = e.code.startsWith('Digit') || e.code.startsWith('Numpad');
      if (e.altKey && e.shiftKey && isNumberKey) {
        e.preventDefault();
        const num = parseInt(e.code.replace('Digit', '').replace('Numpad', ''), 10);
        if (num - 1 >= 0 && num - 1 < cursos.length) setFocusedIndex(num - 1); 
        return;
      }

      // ... (Navegación normal y elástica se mantienen igual)
      if (!e.altKey && !e.ctrlKey && !e.shiftKey) {
        if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
          e.preventDefault();
          if (selectedIds.size > 0) { setSelectedIds(new Set()); setSelectionAnchor(null); }
          if (e.code === 'ArrowRight') setFocusedIndex(prev => Math.min(prev + 1, cursos.length - 1));
          else setFocusedIndex(prev => Math.max(prev - 1, -1));
        }
      }

      if (e.code === 'Enter') {
        e.preventDefault();
        if (focusedIndex === -1) setIsModalOpen(true);
        else if (focusedIndex >= 0) onSelectCurso(cursos[focusedIndex].id);
      }

      if (e.ctrlKey && e.shiftKey) {
        if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
          e.preventDefault();
          let currentAnchor = selectionAnchor !== null ? selectionAnchor : (focusedIndex >= 0 ? focusedIndex : 0);
          setSelectionAnchor(currentAnchor);
          const newFocus = e.code === 'ArrowRight' ? Math.min(focusedIndex + 1, cursos.length - 1) : Math.max(focusedIndex - 1, 0);
          setFocusedIndex(newFocus);
          
          const newSelected = new Set<string>();
          for (let i = Math.min(currentAnchor, newFocus); i <= Math.max(currentAnchor, newFocus); i++) {
            newSelected.add(cursos[i].id);
          }
          setSelectedIds(newSelected);
        }
      }

      // --- NUEVO: ABRIR EL SPOTLIGHT CON CTRL + K ---
      if (e.ctrlKey && e.code === 'KeyK') {
        e.preventDefault();
        if (focusedIndex >= 0) {
          setMenuOptionIndex(0);
          setIsMenuOpen(true);
        }
      }
    };

    // FIX 3: { capture: true } asegura que el Dashboard intercepte la tecla ANTES que App.tsx
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [cursos, focusedIndex, onSelectCurso, selectedIds, selectionAnchor, isMenuOpen, menuOptionIndex]);

  return (
    <div className="view-container slide-up-enter dashboard-container" style={{ position: 'relative', zIndex: isMenuOpen ? 10001 : 1 }}>
      
      {/* 2. EL OVERLAY MAESTRO: Si haces clic fuera del menú, cierra el Spotlight */}
      <GlobalOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} zIndex={10000} />

      <NewCourseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={onRecargar} />

      <div className="navigation-hint top-hint"><div className="shape-triangle up"></div></div>
      <div className="dashboard-header"><h2 className="brand-text">GESTIÓN DE CURSOS</h2><div className="shape-dash"></div></div>
      
      {/* FIX 6: Le damos una clase especial a la grilla cuando el foco está activo */}
      <div className={`courses-grid ${isMenuOpen ? 'spotlight-active' : ''}`}>
        
        <div className={`course-card new-course-card ${focusedIndex === -1 ? 'focused' : ''}`} onClick={() => setIsModalOpen(true)}>
          <div className="shape-plus"></div><span className="brand-text" style={{ fontSize: '0.75rem' }}>NUEVO CURSO</span>
        </div>

        {cursos.map((curso, index) => {
          const isFocused = focusedIndex === index;
          const isSelected = selectedIds.has(curso.id);
          const isSpotlight = isMenuOpen && isFocused;

          return (
            <div 
              key={curso.id} 
              className={`course-card ${isFocused && !isMenuOpen ? 'focused' : ''} ${isSelected ? 'selected' : ''} ${isSpotlight ? 'elevated-spotlight' : ''}`}
              onClick={() => {
                setFocusedIndex(index);
                if (!isMenuOpen) onSelectCurso(curso.id);
              }}
            >
              <div className="card-top">
                <div style={{ position: 'relative' }}>
                  {isAltShiftPressed && !isMenuOpen && (
                    <div className="shortcut-hint" style={{ top: '-15px', left: '-20px' }}>{index + 1}</div>
                  )}
                  <div className="card-abbr">{curso.abreviatura}</div>
                </div>
                
                <button 
                  className="card-options-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFocusedIndex(index);
                    setMenuOptionIndex(0);
                    setIsMenuOpen(true);
                  }}
                >
                  {isSelected ? <div style={{ color: 'var(--accent-color)', fontSize: '1rem' }}>✓</div> : <div className="shape-circle"></div>}
                </button>
              </div>
              
              <div className="card-name">{curso.nombre}</div>
              <div className="card-meta">{curso.ambientes.length} ambientes</div>

              {isSpotlight && (
                <div className="command-menu">
                  {OPCIONES_MENU.map((opcion, i) => (
                    <div key={opcion} className={`command-option ${menuOptionIndex === i ? 'active' : ''} ${opcion === 'Eliminar' ? 'danger' : ''}`}>
                      {menuOptionIndex === i ? <span style={{ color: 'inherit' }}>—</span> : <span style={{ width: '12px' }}></span>}
                      {opcion}
                    </div>
                  ))}
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}