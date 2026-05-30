// Ruta: src/screens/CourseView.tsx
import { useCourseViewViewModel } from '../viewmodels/useCourseViewViewModel';
import { CursoDetalle, formatTaskDueDate } from '../services/database';
import { GenericSwitcher } from '../components/core/GenericSwitcher';

interface CourseViewProps {
  curso: CursoDetalle | null;
  onBack: () => void; // Function to go back to Dashboard
  onSelectAmbiente: (ambienteId: string) => void;
  onSelectNota: (notaId: string, ambienteId: string) => void;
}

export function CourseView({ curso, onBack, onSelectAmbiente, onSelectNota }: CourseViewProps) {
  
  const vm = useCourseViewViewModel(curso, onBack, onSelectAmbiente, onSelectNota);

  if (!curso) return <div className="view-container">Cargando curso...</div>;

  return (
    <div className="view-container slide-left-enter course-view-container">
      
      {/* Indicador espacial: El Dashboard está hacia la izquierda */}
      <div className="navigation-hint left-hint" onClick={onBack} style={{ cursor: 'pointer' }}>
        <div className="shape-triangle left"></div>
      </div>
      
      <div className="view-header-layout">
        <div className="view-header-titles">
          <span className="view-header-category">VISTA DE CURSO</span>
          <h2 className="view-header-title">{curso.nombre.toUpperCase()}</h2>
        </div>
        <div className="view-header-decor">
          <div className="shape-dash"></div>
        </div>
      </div>

      {/* Pestañas de Ambientes y Tareas Pendientes */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${vm.activeTab === 'environments' ? 'active' : ''}`}
          onClick={() => vm.setActiveTab('environments')}
        >
          Ambientes
        </button>
        <button 
          className={`tab-button ${vm.activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => vm.setActiveTab('tasks')}
        >
          Tareas Pendientes
        </button>
      </div>

      <div className="courses-list">
        {vm.activeTab === 'environments' ? (
          <div className="environments-list" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {vm.ambientes.map((amb, index) => {
              const id = `env-${index}`;
              const count = vm.tareas.filter(t => t.ambienteId === amb.id && t.estado !== 'completed').length;
              const isFocused = index === vm.focusedIndex;
              
              return (
                <div 
                  key={amb.id} 
                  id={id}
                  className={`course-list-item ${isFocused ? 'focused' : ''}`}
                  onClick={() => onSelectAmbiente(amb.id)}
                  style={{ 
                    display: 'flex',
                    flexDirection: 'column', 
                    alignItems: 'stretch', 
                    padding: '15px 20px', 
                    gap: '4px',
                    width: '100%',
                    boxSizing: 'border-box',
                    minWidth: 0
                  }}
                >
                  <div className="course-list-item-left" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="brand-text" style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                      {amb.nombre.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '2px' }}>
                      {count} {count === 1 ? 'tarea pendiente' : 'tareas pendientes'}
                    </span>
                  </div>
                </div>
              );
            })}

            {vm.ambientes.length === 0 && (
              <p style={{ opacity: 0.4, fontSize: '0.8rem', textAlign: 'center', padding: '20px' }}>No hay ambientes en este curso.</p>
            )}
          </div>
        ) : (
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
                  onClick={() => task.notaId && onSelectNota(task.notaId, task.ambienteId)}
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

                    {/* Fila Intermedia: Fecha y hora de entrega */}
                    <span className="task-due-date brand-text" style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '2px' }}>
                      {formatTaskDueDate(task.fechaEntrega)}
                    </span>

                    {/* Fila Inferior: Ambiente e Indicador de Estado */}
                    <div className="task-card-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span className="task-environment-badge" style={{ fontSize: '0.65rem', opacity: 0.4, letterSpacing: '0.5px' }}>
                        {task.ambienteNombre.toUpperCase()}
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
              <p className="no-tasks-hint">No hay tareas pendientes en este curso.</p>
            )}
          </div>
        )}
      </div>

      {/* Buscador de Ambientes (se activa con Ctrl + Tab) */}
      <GenericSwitcher
        isOpen={vm.switcher.isOpen}
        onClose={vm.switcher.close}
        title={`Ambientes de ${curso.nombre}`}
        items={vm.switcherItems}
        selectedIndex={vm.switcher.selectedIndex}
        renderItem={(item, isSelected) => (
          <div 
            key={item} 
            className={`switcher-item ${isSelected ? 'selected' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              const ambObj = vm.ambientes.find(a => a.nombre === item);
              if (ambObj) {
                onSelectAmbiente(ambObj.id);
              }
              vm.switcher.close();
            }}
          >
            <span className="switcher-name">{item}</span>
          </div>
        )}
      />

    </div>
  );
}