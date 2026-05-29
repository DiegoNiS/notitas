import { GlobalOverlay } from '../components/core/GlobalOverlay';
import { NewCourseModal } from '../components/composite/NewCourseModal';
import { CursoDetalle } from '../services/database';
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel';
import { CursosSwitcher } from '../components/composite/CursosSwitcher';

interface DashboardProps {
  cursos: CursoDetalle[];
  onRecargar: () => void;
  onSelectCurso: (cursoId: string) => void;
}

export function Dashboard({ cursos, onRecargar, onSelectCurso }: DashboardProps) {
  const vm = useDashboardViewModel(cursos, onSelectCurso);

  return (
    <div className="view-container slide-up-enter dashboard-container" style={{ position: 'relative', zIndex: vm.isMenuOpen ? 10001 : 1 }}>
      
      {/* Buscador de Cursos global (se activa con Ctrl + Tab) */}
      <CursosSwitcher 
        isOpen={vm.switcher.isOpen} 
        onClose={vm.switcher.close} 
        cursos={cursos} 
        onSelectCurso={onSelectCurso} 
        selectedIndex={vm.switcher.selectedIndex}
      />

      {/* Overlay maestro para cerrar el Spotlight haciendo clic fuera */}
      <GlobalOverlay isOpen={vm.isMenuOpen} onClose={() => vm.setIsMenuOpen(false)} zIndex={10000} />

      {/* Modal para crear un nuevo curso */}
      <NewCourseModal isOpen={vm.isModalOpen} onClose={() => vm.setIsModalOpen(false)} onSuccess={onRecargar} />

      <div className="navigation-hint top-hint"><div className="shape-triangle up"></div></div>
      <div className="dashboard-header"><h2 className="brand-text">GESTIÓN DE CURSOS</h2><div className="shape-dash"></div></div>
      
      {/* Clase especial en la lista si el Spotlight está activo */}
      <div className={`courses-list ${vm.isMenuOpen ? 'spotlight-active' : ''}`}>
        
        {/* Ítem para crear nuevo curso */}
        <div 
          className={`course-list-item new-course-item ${vm.focusedIndex === -1 ? 'focused' : ''}`} 
          onClick={() => vm.setIsModalOpen(true)}
        >
          <div className="course-list-item-left">
            <span className="course-list-abbr">-</span>
            <span className="course-list-name brand-text" style={{ fontSize: '0.85rem' }}>NUEVO CURSO</span>
            <span className="course-list-abbr">-</span>
          </div>
        </div>

        {/* Elementos de cursos */}
        {cursos.map((curso, index) => {
          const isFocused = vm.focusedIndex === index;
          const isSelected = vm.selectedIds.has(curso.id);
          const isSpotlight = vm.isMenuOpen && isFocused;

          return (
            <div 
              key={curso.id} 
              className={`course-list-item ${isFocused && !vm.isMenuOpen ? 'focused' : ''} ${isSelected ? 'selected' : ''} ${isSpotlight ? 'elevated-spotlight' : ''}`}
              onClick={() => {
                vm.setFocusedIndex(index);
                if (!vm.isMenuOpen) onSelectCurso(curso.id);
              }}
            >
              {vm.isAltShiftPressed && !vm.isMenuOpen && (
                <div className="shortcut-hint" style={{ position: 'static', marginRight: '16px', alignSelf: 'center' }}>{index + 1}</div>
              )}
              
              <div className="course-list-item-left">
                <span className="course-list-abbr">{curso.abreviatura}</span>
                <span className="course-list-name">{curso.nombre}</span>
              </div>
              
              <div className="course-list-item-right">
                {curso.tareasCount > 0 && (
                  <span className="course-list-tasks">{curso.tareasCount} tareas</span>
                )}
                
                {vm.selectedIds.size > 0 ? (
                  <button 
                    className="card-options-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newSelected = new Set(vm.selectedIds);
                      if (newSelected.has(curso.id)) {
                        newSelected.delete(curso.id);
                      } else {
                        newSelected.add(curso.id);
                      }
                      vm.setSelectedIds(newSelected);
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <div className={`shape-square-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <span style={{ color: '#000', fontSize: '0.65rem', fontWeight: 'bold' }}>✓</span>}
                    </div>
                  </button>
                ) : (
                  <button 
                    className="card-options-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      vm.setFocusedIndex(index);
                      vm.setMenuOptionIndex(0);
                      vm.setIsMenuOpen(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}
                  >
                    <span style={{ fontSize: '0.75rem', letterSpacing: '1px', fontWeight: 'bold' }}>•••</span>
                  </button>
                )}
              </div>

              {isSpotlight && (
                <div className="command-menu" style={{ right: '40px', top: '100%' }}>
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