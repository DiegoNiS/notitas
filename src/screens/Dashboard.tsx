import { GlobalOverlay } from '../components/GlobalOverlay';
import { NewCourseModal } from '../components/NewCourseModal';
import { CursoDetalle } from '../services/database';
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel';

interface DashboardProps {
  cursos: CursoDetalle[];
  onRecargar: () => void;
  onSelectCurso: (cursoId: string) => void;
}

export function Dashboard({ cursos, onRecargar, onSelectCurso }: DashboardProps) {
  const vm = useDashboardViewModel(cursos, onRecargar, onSelectCurso);

  return (
    <div className="view-container slide-up-enter dashboard-container" style={{ position: 'relative', zIndex: vm.isMenuOpen ? 10001 : 1 }}>
      
      {/* Overlay maestro para cerrar el Spotlight haciendo clic fuera */}
      <GlobalOverlay isOpen={vm.isMenuOpen} onClose={() => vm.setIsMenuOpen(false)} zIndex={10000} />

      {/* Modal para crear un nuevo curso */}
      <NewCourseModal isOpen={vm.isModalOpen} onClose={() => vm.setIsModalOpen(false)} onSuccess={onRecargar} />

      <div className="navigation-hint top-hint"><div className="shape-triangle up"></div></div>
      <div className="dashboard-header"><h2 className="brand-text">GESTIÓN DE CURSOS</h2><div className="shape-dash"></div></div>
      
      {/* Clase especial en la cuadrícula si el Spotlight está activo */}
      <div className={`courses-grid ${vm.isMenuOpen ? 'spotlight-active' : ''}`}>
        
        {/* Tarjeta para crear nuevo curso */}
        <div 
          className={`course-card new-course-card ${vm.focusedIndex === -1 ? 'focused' : ''}`} 
          onClick={() => vm.setIsModalOpen(true)}
        >
          <div className="shape-plus"></div>
          <span className="brand-text" style={{ fontSize: '0.75rem' }}>NUEVO CURSO</span>
        </div>

        {/* Tarjetas de cursos */}
        {cursos.map((curso, index) => {
          const isFocused = vm.focusedIndex === index;
          const isSelected = vm.selectedIds.has(curso.id);
          const isSpotlight = vm.isMenuOpen && isFocused;

          return (
            <div 
              key={curso.id} 
              className={`course-card ${isFocused && !vm.isMenuOpen ? 'focused' : ''} ${isSelected ? 'selected' : ''} ${isSpotlight ? 'elevated-spotlight' : ''}`}
              onClick={() => {
                vm.setFocusedIndex(index);
                if (!vm.isMenuOpen) onSelectCurso(curso.id);
              }}
            >
              <div className="card-top">
                <div style={{ position: 'relative' }}>
                  {vm.isAltShiftPressed && !vm.isMenuOpen && (
                    <div className="shortcut-hint" style={{ top: '-15px', left: '-20px' }}>{index + 1}</div>
                  )}
                  <div className="card-abbr">{curso.abreviatura}</div>
                </div>
                
                <button 
                  className="card-options-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    vm.setFocusedIndex(index);
                    vm.setMenuOptionIndex(0);
                    vm.setIsMenuOpen(true);
                  }}
                >
                  {isSelected ? <div style={{ color: 'var(--accent-color)', fontSize: '1rem' }}>✓</div> : <div className="shape-circle"></div>}
                </button>
              </div>
              
              <div className="card-name">{curso.nombre}</div>
              <div className="card-meta">{curso.ambientes.length} ambientes</div>

              {isSpotlight && (
                <div className="command-menu">
                  {vm.OPCIONES_MENU.map((opcion, i) => (
                    <div key={opcion} className={`command-option ${vm.menuOptionIndex === i ? 'active' : ''} ${opcion === 'Eliminar' ? 'danger' : ''}`}>
                      {vm.menuOptionIndex === i ? <span style={{ color: 'inherit' }}>—</span> : <span style={{ width: '12px' }}></span>}
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