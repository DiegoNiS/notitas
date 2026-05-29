// Ruta: src/screens/EnvironmentView.tsx
import { useEnvironmentViewViewModel } from '../viewmodels/useEnvironmentViewViewModel';
import { CursoDetalle, db } from '../services/database';

interface EnvironmentViewProps {
  curso: CursoDetalle | null;
  ambienteId: string;
  onBack: () => void;
  navigateTo: (route: any) => void;
}

export function EnvironmentView({ curso, ambienteId, onBack, navigateTo }: EnvironmentViewProps) {
  const vm = useEnvironmentViewViewModel(curso, ambienteId, onBack, navigateTo);

  // Manejador de navegación con las flechas Arriba y Abajo, Enter y Space
  const handleKeyDown = (
    e: React.KeyboardEvent, 
    type: 'task' | 'note', 
    index: number, 
    maxLength: number
  ) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % maxLength;
      const nextId = `${type}-${nextIndex}`;
      if (type === 'task') {
        vm.setActiveTaskIndex(nextIndex);
      } else {
        vm.setActiveNoteIndex(nextIndex);
      }
      document.getElementById(nextId)?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + maxLength) % maxLength;
      const prevId = `${type}-${prevIndex}`;
      if (type === 'task') {
        vm.setActiveTaskIndex(prevIndex);
      } else {
        vm.setActiveNoteIndex(prevIndex);
      }
      document.getElementById(prevId)?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'task') {
        const task = vm.tareas[index];
        if (task && task.notaId && curso) {
          navigateTo({ type: 'editor', courseId: curso.id, ambienteId, notaId: task.notaId });
        }
      } else {
        const nota = vm.notas[index];
        if (nota && curso) {
          navigateTo({ type: 'editor', courseId: curso.id, ambienteId, notaId: nota.id });
        }
      }
    } else if (e.key === ' ' || e.code === 'Space') {
      if (type === 'task') {
        e.preventDefault();
        const task = vm.tareas[index];
        if (task) {
          vm.toggleTaskStatus(task);
        }
      }
    }
  };

  if (!curso) return <div className="view-container">Cargando ambiente...</div>;

  return (
    <div className="view-container slide-left-enter course-view-container">
      
      {/* Indicador espacial de regreso */}
      <div className="navigation-hint left-hint" onClick={onBack} style={{ cursor: 'pointer' }}>
        <div className="shape-triangle left"></div>
      </div>
      
      <div className="course-view-header">
        <h2 className="brand-text">
          {curso.nombre.toUpperCase()} - {vm.ambiente ? vm.ambiente.nombre.toUpperCase() : ''}
        </h2>
        <div className="shape-dash"></div>
      </div>

      <div className="course-view-content" style={{ gridTemplateColumns: '1fr', gap: '30px' }}>
        
        {/* Sección superior: Tareas Próximas (Ancho Completo) */}
        <div className="course-view-main" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ marginBottom: 0 }}>TAREAS PRÓXIMAS</h3>
          </div>

          <div className="tasks-list">
            {vm.tareas.map((task, index) => {
              const id = `task-${index}`;
              const isCompleted = task.estado === 'completed';
              const isFocused = index === vm.activeTaskIndex;
              const cleanedDate = task.fechaEntrega.replace(/^\(|\)$/g, '');
              
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
                  onKeyDown={(e) => handleKeyDown(e, 'task', index, vm.tareas.length)}
                  onClick={() => task.notaId && navigateTo({ type: 'editor', courseId: curso.id, ambienteId, notaId: task.notaId })}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '15px 20px', gap: '10px', cursor: 'pointer' }}
                >
                  <div className="course-list-item-left" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    
                    {/* Fila Superior: Descripción */}
                    <span className="task-description" style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'none', color: '#ffffff' }}>
                      {task.descripcion}
                    </span>

                    {/* Fila Inferior: Fecha/Hora de entrega y Cuadritos de estado juntos */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span className="task-due-date brand-text" style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '2px' }}>
                        {cleanedDate}
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

        {/* Separador Minimalista */}
        <div className="shape-dash" style={{ width: '100%', opacity: 0.1, margin: '20px 0 10px 0' }}></div>

        {/* Sección inferior: Notas del Ambiente */}
        <div className="course-view-main" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ marginBottom: 0 }}>NOTAS</h3>
            <button 
              className="btn-ghost" 
              onClick={() => vm.handleCrearNota()} 
              style={{ fontSize: '0.65rem', letterSpacing: '1px', padding: '4px 8px' }}
            >
              [+] NUEVA NOTA
            </button>
          </div>

          <div className="notes-grid">
            {vm.notas.map((nota, index) => {
              const id = `note-${index}`;
              const isFocused = index === vm.activeNoteIndex;
              const tareasCount = db.obtenerTareasCountDeNotaSync(nota.id);
              
              return (
                <div 
                  key={nota.id} 
                  id={id}
                  tabIndex={isFocused ? 0 : -1}
                  className="note-card"
                  onFocus={() => {
                    vm.handleElementFocus(id);
                    vm.setActiveNoteIndex(index);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, 'note', index, vm.notas.length)}
                  onClick={() => navigateTo({ type: 'editor', courseId: curso.id, ambienteId, notaId: nota.id })}
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '18px' }}
                >
                  <h4 className="note-title">{nota.titulo}</h4>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                      {tareasCount} {tareasCount === 1 ? 'tarea' : 'tareas'}
                    </span>
                    <span className="note-date brand-text" style={{ fontSize: '0.65rem', opacity: 0.4 }}>
                      {nota.fecha_creacion.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}

            {vm.notas.length === 0 && (
              <p className="no-tasks-hint">No hay notas registradas en este ambiente. Presiona Ctrl + N para agregar una.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
