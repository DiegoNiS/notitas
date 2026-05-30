// Ruta: src/screens/Dashboard.tsx
import { GlobalOverlay } from '../components/core/GlobalOverlay';
import { NewCourseModal } from '../components/composite/NewCourseModal';
import { CursoDetalle } from '../services/database';
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel';
import { CursosSwitcher } from '../components/composite/CursosSwitcher';
import { EditarCursoModal } from '../components/composite/EditarCursoModal';
import { ConfirmModal } from '../components/composite/ConfirmModal';

interface DashboardProps {
  cursos: CursoDetalle[];
  onRecargar: () => void;
  onSelectCurso: (cursoId: string) => void;
}

export function Dashboard({ cursos, onRecargar, onSelectCurso }: DashboardProps) {
  const vm = useDashboardViewModel(cursos, onSelectCurso, onRecargar);

  return (
    <div className="view-container slide-up-enter dashboard-container" style={{ position: 'relative', zIndex: vm.isMenuOpen ? 10001 : 1 }}>
      
      {/* Buscador de Cursos global (se activa con Ctrl + Tab) */}
      <CursosSwitcher 
        isOpen={vm.switcher.isOpen} 
        onClose={vm.switcher.close} 
        cursos={vm.filteredCursos} 
        onSelectCurso={onSelectCurso} 
        selectedIndex={vm.switcher.selectedIndex}
      />

      {/* Overlay maestro para cerrar el Spotlight haciendo clic fuera */}
      <GlobalOverlay isOpen={vm.isMenuOpen} onClose={() => vm.setIsMenuOpen(false)} zIndex={10000} />

      {/* Modal para crear un nuevo curso */}
      <NewCourseModal isOpen={vm.isModalOpen} onClose={() => vm.setIsModalOpen(false)} onSuccess={onRecargar} />

      {/* Modal para editar un curso existente y sus ambientes */}
      <EditarCursoModal 
        isOpen={vm.isEditModalOpen} 
        onClose={() => {
          vm.setIsEditModalOpen(false);
          vm.setCursoAEditar(null);
        }} 
        onSuccess={onRecargar}
        curso={vm.cursoAEditar}
      />

      {/* Confirmar eliminación de un curso */}
      <ConfirmModal 
        isOpen={vm.isConfirmDeleteOpen}
        onClose={() => {
          vm.setIsConfirmDeleteOpen(false);
          vm.setCursoAEliminar(null);
        }}
        onConfirm={vm.handleEliminarCursoConfirmado}
        title="ELIMINAR CURSO"
        message={`Esta acción eliminará de forma permanente el curso "${vm.cursoAEliminar?.nombre}" (${vm.cursoAEliminar?.abreviatura}) y TODOS sus ambientes, notas (incluyendo archivos de notas locales en disco) y tareas. Esta operación no se puede deshacer. ¿Deseas continuar?`}
        confirmText="ELIMINAR CURSO"
        isDanger={true}
      />

      <div className="navigation-hint top-hint"><div className="shape-triangle up"></div></div>
      <div className="view-header-layout">
        <div className="view-header-titles">
          <span className="view-header-category">APLICACIÓN</span>
          <h2 className="view-header-title">GESTIÓN DE CURSOS</h2>
        </div>
        <div className="view-header-decor">
          <div className="shape-dash"></div>
        </div>
      </div>

      {/* Pestañas de Cursos Activos / Archivados */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${vm.activeTab === 'active' ? 'active' : ''}`}
          onClick={() => vm.setActiveTab('active')}
        >
          Cursos Activos
        </button>
        <button 
          className={`tab-button ${vm.activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => vm.setActiveTab('archived')}
        >
          Cursos Archivados
        </button>
      </div>
      
      {/* Clase especial en la lista si el Spotlight está activo */}
      <div className={`courses-list ${vm.isMenuOpen ? 'spotlight-active' : ''}`}>
        
        {/* Ítem para crear nuevo curso */}
        {vm.activeTab === 'active' && (
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
        )}

        {/* Mensaje si la lista está vacía */}
        {vm.filteredCursos.length === 0 && (
          <div style={{ 
            padding: '40px 20px', 
            textAlign: 'center', 
            opacity: 0.4, 
            fontSize: '0.8rem', 
            border: '1px dashed rgba(255,255,255,0.06)', 
            borderRadius: '6px',
            color: 'var(--text-color)',
            width: '100%'
          }}>
            {vm.activeTab === 'active' 
              ? 'No hay cursos activos. ¡Crea uno nuevo para comenzar!' 
              : 'No hay cursos archivados.'}
          </div>
        )}

        {/* Elementos de cursos */}
        {vm.filteredCursos.map((curso, index) => {
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
                <span className="course-list-name">
                  {curso.nombre} 
                  {curso.archivado === 1 && (
                    <span style={{ fontSize: '0.6rem', opacity: 0.4, marginLeft: '10px', letterSpacing: '0.5px' }}>[ARCHIVADO]</span>
                  )}
                </span>
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