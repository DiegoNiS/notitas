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
  
  const vm = useCourseViewViewModel(curso, onBack, onSelectAmbiente);

  // Manejador de navegación con las flechas Arriba y Abajo, Enter y Space
  const handleKeyDown = (
    e: React.KeyboardEvent, 
    type: 'env' | 'task', 
    index: number, 
    maxLength: number
  ) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % maxLength;
      const nextId = `${type}-${nextIndex}`;
      if (type === 'env') {
        vm.setActiveEnvIndex(nextIndex);
      } else {
        vm.setActiveTaskIndex(nextIndex);
      }
      document.getElementById(nextId)?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + maxLength) % maxLength;
      const prevId = `${type}-${prevIndex}`;
      if (type === 'env') {
        vm.setActiveEnvIndex(prevIndex);
      } else {
        vm.setActiveTaskIndex(prevIndex);
      }
      document.getElementById(prevId)?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'env') {
        const amb = vm.ambientes[index];
        if (amb) {
          onSelectAmbiente(amb.id);
        }
      } else {
        const task = vm.tareas[index];
        if (task && task.notaId) {
          onSelectNota(task.notaId, task.ambienteId);
        }
      }
    } else if (e.key === ' ' || e.code === 'Space') {
      if (type === 'task') {
        e.preventDefault();
        const task = vm.tareas[index];
        if (task) {
          vm.toggleTaskStatus(task);
          setTimeout(() => {
            const currentElement = document.getElementById(`${type}-${index}`);
            if (currentElement) {
              currentElement.focus();
            }
          }, 50);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (type === 'env') {
        const activeTaskId = `task-${vm.activeTaskIndex}`;
        document.getElementById(activeTaskId)?.focus();
      } else {
        const activeEnvId = `env-${vm.activeEnvIndex}`;
        document.getElementById(activeEnvId)?.focus();
      }
    }
  };

  if (!curso) return <div className="view-container">Cargando curso...</div>;

  const tareasFiltradas = vm.tareas; // Ya no filtramos localmente en esta vista

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

      <div className="course-view-content">
        
        {/* Columna Izquierda: Ambientes */}
        <div className="course-view-sidebar">
          <h3 className="section-title">AMBIENTES</h3>
          <div className="environments-list">
            {vm.ambientes.map((amb, index) => {
              const id = `env-${index}`;
              const count = vm.tareas.filter(t => t.ambienteId === amb.id && t.estado !== 'completed').length;
              const isFocused = index === vm.activeEnvIndex;
              
              return (
                <div 
                  key={amb.id} 
                  id={id}
                  tabIndex={isFocused ? 0 : -1}
                  className="course-list-item"
                  onFocus={() => {
                    vm.handleElementFocus(id);
                    vm.setActiveEnvIndex(index);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, 'env', index, vm.ambientes.length)}
                  onClick={() => onSelectAmbiente(amb.id)}
                  style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '12px 15px', gap: '4px' }}
                >
                  <div className="course-list-item-left">
                    <span className="brand-text" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                      {amb.nombre.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '2px' }}>
                      {count} {count === 1 ? 'tarea pendiente' : 'tareas pendientes'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Tareas */}
        <div className="course-view-main">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              TAREAS PENDIENTES
            </h3>
          </div>

          <div className="tasks-list">
            {tareasFiltradas.map((task, index) => {
              const id = `task-${index}`;
              const isCompleted = task.estado === 'completed';
              const isFocused = index === vm.activeTaskIndex;
              
              return (
                <div 
                  key={task.id} 
                  id={id}
                  tabIndex={isFocused ? 0 : -1}
                  className={`course-list-item task-list-item status-${task.estado}`}
                  onFocus={() => {
                    vm.handleElementFocus(id);
                    vm.setActiveTaskIndex(index);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, 'task', index, tareasFiltradas.length)}
                  onClick={() => task.notaId && onSelectNota(task.notaId, task.ambienteId)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '15px 20px', gap: '10px', cursor: 'pointer' }}
                >
                  <div className="course-list-item-left" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    
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
                      >
                        <div className={`status-square ${task.estado === 'in_progress' || isCompleted ? 'active' : ''}`}></div>
                        <div className={`status-square ${isCompleted ? 'active' : ''}`}></div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}

            {tareasFiltradas.length === 0 && (
              <p className="no-tasks-hint">No hay tareas pendientes en este curso.</p>
            )}
          </div>
        </div>

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