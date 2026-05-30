// Ruta: src/screens/EnvironmentView.tsx
import { useEnvironmentViewViewModel } from '../viewmodels/useEnvironmentViewViewModel';
import { CursoDetalle, db, formatTaskDueDate } from '../services/database';
import { NotesSwitcher } from '../components/composite/NotesSwitcher';
import { TasksSwitcher } from '../components/composite/TasksSwitcher';
import { ConfirmModal } from '../components/composite/ConfirmModal';
import { GlobalOverlay } from '../components/core/GlobalOverlay';

interface EnvironmentViewProps {
  curso: CursoDetalle | null;
  ambienteId: string;
  onBack: () => void;
  navigateTo: (route: any) => void;
}

export function EnvironmentView({ curso, ambienteId, onBack, navigateTo }: EnvironmentViewProps) {
  const vm = useEnvironmentViewViewModel(curso, ambienteId, onBack, navigateTo);

  if (!curso) return <div className="view-container">Cargando ambiente...</div>;

  return (
    <div className="view-container slide-left-enter course-view-container">
      
      {/* Indicador espacial de regreso */}
      <div className="navigation-hint left-hint" onClick={onBack} style={{ cursor: 'pointer' }}>
        <div className="shape-triangle left"></div>
      </div>
      
      <div className="course-view-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '15px', marginBottom: '25px', gap: '20px' }}>
        <div className="view-header-layout" style={{ borderBottom: 'none', paddingBottom: 0, margin: 0, width: '100%' }}>
          <div className="view-header-titles">
            <span className="view-header-category">VISTA DE AMBIENTE</span>
            <h2 className="view-header-title">{vm.ambiente ? vm.ambiente.nombre.toUpperCase() : ''}</h2>
            <span className="view-header-subtitle">CURSO: {curso.nombre.toUpperCase()}</span>
          </div>
          <div className="view-header-decor">
            <div className="shape-dash"></div>
          </div>
        </div>

        {/* Pestañas de Notas y Tareas Pendientes */}
        <div className="dashboard-tabs" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
          <button 
            className={`tab-button ${vm.mode === 'notes' ? 'active' : ''}`}
            onClick={() => vm.setMode('notes')}
          >
            Notas
          </button>
          <button 
            className={`tab-button ${vm.mode === 'tasks' ? 'active' : ''}`}
            onClick={() => vm.setMode('tasks')}
          >
            Tareas Pendientes
          </button>
        </div>
      </div>

      <div className="courses-list">
        {vm.mode === 'tasks' ? (
          /* PANE 1: TAREAS PENDIENTES DEL AMBIENTE */
          <div className="course-view-main" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="tasks-list" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {vm.tareas.map((task, index) => {
                const id = `task-${index}`;
                const isCompleted = task.estado === 'completed';
                const isFocused = index === vm.focusedIndex;
                
                return (
                  <div 
                    key={task.id} 
                    id={id}
                    className={`course-list-item task-list-item status-${task.estado} ${isFocused ? 'focused' : ''}`}
                    onClick={() => task.notaId && navigateTo({ type: 'editor', courseId: curso.id, ambienteId, notaId: task.notaId })}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'stretch', 
                      padding: '15px 20px', 
                      gap: '10px', 
                      cursor: 'pointer',
                      width: '100%',
                      boxSizing: 'border-box',
                      minWidth: 0
                    }}
                  >
                    <div className="course-list-item-left" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      
                      {/* Fila Superior: Descripción */}
                      <span className="task-description" style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'none', color: '#ffffff' }}>
                        {task.descripcion}
                      </span>

                      {/* Fila Inferior: Fecha/Hora de entrega y Cuadritos de estado */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span className="task-due-date brand-text" style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '2px' }}>
                          {formatTaskDueDate(task.fechaEntrega)}
                        </span>

                        <div 
                          className="task-status-squares" 
                          onClick={(e) => {
                            e.stopPropagation();
                            vm.toggleTaskStatus(task);
                          }}
                          style={{ display: 'flex', gap: '4px' }}
                        >
                          <div className={`status-square ${task.estado === 'in_progress' || isCompleted ? 'active' : ''}`}></div>
                          <div className={`status-square ${isCompleted ? 'active' : ''}`}></div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}

              {vm.tareas.length === 0 && (
                <p className="no-tasks-hint">No hay tareas pendientes en este ambiente.</p>
              )}
            </div>
          </div>
        ) : (
          /* PANE 2: NOTAS DEL AMBIENTE */
          <div className="course-view-main" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="note-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {/* Botón de creación integrado en la lista como index 0 */}
              <div
                id="note-0"
                className={`course-list-item note-list-item create-button-item ${vm.focusedIndex === 0 ? 'focused' : ''}`}
                onClick={() => vm.handleCrearNota()}
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  padding: '12px 15px',
                  cursor: 'pointer',
                  width: '100%',
                  boxSizing: 'border-box',
                  minWidth: 0
                }}
              >
                <span className="brand-text" style={{ fontSize: '0.85rem', letterSpacing: '1.5px' }}>
                  [+] NUEVA NOTA
                </span>
              </div>

              {vm.notas.map((nota, index) => {
                const listIndex = index + 1;
                const id = `note-${listIndex}`;
                const isFocused = listIndex === vm.focusedIndex;
                const tareasCount = db.obtenerTareasCountDeNotaSync(nota.id);
                const isSpotlight = vm.isMenuOpen && isFocused;
                
                return (
                  <div 
                    key={nota.id} 
                    id={id}
                    className={`course-list-item note-list-item ${isFocused && !vm.isMenuOpen ? 'focused' : ''} ${isSpotlight ? 'elevated-spotlight' : ''}`}
                    onClick={() => {
                      if (!vm.isMenuOpen) {
                        navigateTo({ type: 'editor', courseId: curso.id, ambienteId, notaId: nota.id });
                      }
                    }}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px 15px', 
                      cursor: 'pointer',
                      position: 'relative',
                      width: '100%',
                      boxSizing: 'border-box',
                      minWidth: 0
                    }}
                  >
                    <div className="course-list-item-left" style={{ flex: 1, minWidth: 0, boxSizing: 'border-box' }}>
                      <span className="note-list-title" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                        {nota.titulo}
                      </span>
                    </div>

                    <div className="course-list-item-right" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                        {tareasCount} {tareasCount === 1 ? 'tarea' : 'tareas'}
                      </span>
                      <span className="note-date brand-text" style={{ fontSize: '0.65rem', opacity: 0.4, letterSpacing: '1px' }}>
                        {nota.fecha_creacion.toUpperCase()}
                      </span>
                    </div>

                    {isSpotlight && (
                      <div className="command-menu" style={{ right: '40px', top: '100%', zIndex: 10002 }}>
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

              {vm.notas.length === 0 && (
                <p className="no-tasks-hint" style={{ padding: '20px', textAlign: 'center' }}>No hay notas registradas en este ambiente. Utiliza el botón de creación anterior para empezar.</p>
              )}
            </div>
          </div>
        )}

        {vm.mode === 'notes' ? (
          <NotesSwitcher
            isOpen={vm.switcher.isOpen}
            onClose={vm.switcher.close}
            items={vm.notas}
            onSelectNote={(nota) => navigateTo({ type: 'editor', courseId: curso?.id || '', ambienteId, notaId: nota.id })}
            selectedIndex={vm.switcher.selectedIndex}
          />
        ) : (
          <TasksSwitcher
            isOpen={vm.switcher.isOpen}
            onClose={vm.switcher.close}
            items={vm.tareas}
            onSelectTask={(tarea) => navigateTo({ type: 'editor', courseId: curso?.id || '', ambienteId, notaId: tarea.notaId })}
            selectedIndex={vm.switcher.selectedIndex}
          />
        )}
      </div>

      {/* Overlay maestro para cerrar el Spotlight haciendo clic fuera */}
      <GlobalOverlay isOpen={vm.isMenuOpen} onClose={() => vm.setIsMenuOpen(false)} zIndex={10000} />

      {/* Confirmar eliminación de una nota */}
      <ConfirmModal 
        isOpen={vm.isConfirmDeleteOpen}
        onClose={() => {
          vm.setIsConfirmDeleteOpen(false);
          vm.setNotaAEliminar(null);
        }}
        onConfirm={vm.handleEliminarNotaConfirmado}
        title="ELIMINAR NOTA"
        message={`Esta acción eliminará de forma permanente la nota "${vm.notaAEliminar?.titulo}" y su archivo físico de Markdown en disco, junto con todas sus tareas. ¿Estás seguro?`}
        confirmText="ELIMINAR NOTA"
        isDanger={true}
      />

    </div>
  );
}
