// Ruta: src/screens/EnvironmentView.tsx
import { useEnvironmentViewViewModel } from '../viewmodels/useEnvironmentViewViewModel';
import { CursoDetalle, db, formatTaskDueDate } from '../services/database';
import { NotesSwitcher } from '../components/composite/NotesSwitcher';
import { TasksSwitcher } from '../components/composite/TasksSwitcher';

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
        if (index === 0) {
          vm.handleCrearNota();
        } else {
          const nota = vm.notas[index - 1];
          if (nota && curso) {
            navigateTo({ type: 'editor', courseId: curso.id, ambienteId, notaId: nota.id });
          }
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
    }
  };

  if (!curso) return <div className="view-container">Cargando ambiente...</div>;

  return (
    <div className="view-container slide-left-enter course-view-container">
      
      {/* Indicador espacial de regreso */}
      <div className="navigation-hint left-hint" onClick={onBack} style={{ cursor: 'pointer' }}>
        <div className="shape-triangle left"></div>
      </div>
      
      <div className="course-view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '15px', marginBottom: '25px' }}>
        <div className="view-header-layout" style={{ borderBottom: 'none', paddingBottom: 0, margin: 0, flex: 1, marginRight: '20px' }}>
          <div className="view-header-titles">
            <span className="view-header-category">VISTA DE AMBIENTE</span>
            <h2 className="view-header-title">{vm.ambiente ? vm.ambiente.nombre.toUpperCase() : ''}</h2>
            <span className="view-header-subtitle">CURSO: {curso.nombre.toUpperCase()}</span>
          </div>
          <div className="view-header-decor">
            <div className="shape-dash"></div>
          </div>
        </div>

        {/* Toggle de Modo Notas/Tareas */}
        <button 
          className="btn-ghost" 
          onClick={vm.toggleMode}
          tabIndex={-1}
          style={{ fontSize: '0.7rem', padding: '6px 12px', letterSpacing: '1px' }}
        >
          {vm.mode === 'notes' ? 'VER TAREAS' : 'VER NOTAS'}
        </button>

      </div>

      <div className="course-view-content" style={{ gridTemplateColumns: '1fr', gap: '30px' }}>
        
        {vm.mode === 'tasks' ? (
          /* PANE 1: TAREAS PENDIENTES DEL AMBIENTE */
          <div className="course-view-main" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>TAREAS PRÓXIMAS</h3>
            </div>

            <div className="tasks-list">
              {vm.tareas.map((task, index) => {
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
          /* PANE 2: NOTAS DEL AMBIENTE (Listado minimalista tipo lista) */
          <div className="course-view-main" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>NOTAS</h3>
            </div>

            <div className="note-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Botón de creación integrado en la lista como note-0 */}
              <div
                id="note-0"
                tabIndex={vm.activeNoteIndex === 0 ? 0 : -1}
                className="course-list-item note-list-item create-button-item"
                onFocus={() => {
                  vm.handleElementFocus('note-0');
                  vm.setActiveNoteIndex(0);
                }}
                onKeyDown={(e) => handleKeyDown(e, 'note', 0, vm.notas.length + 1)}
                onClick={() => vm.handleCrearNota()}
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  padding: '12px 15px',
                  cursor: 'pointer',
                }}
              >
                <span className="brand-text" style={{ fontSize: '0.85rem', letterSpacing: '1.5px' }}>
                  [+] NUEVA NOTA
                </span>
              </div>

              {vm.notas.map((nota, index) => {
                const listIndex = index + 1;
                const id = `note-${listIndex}`;
                const isFocused = listIndex === vm.activeNoteIndex;
                const tareasCount = db.obtenerTareasCountDeNotaSync(nota.id);
                
                return (
                  <div 
                    key={nota.id} 
                    id={id}
                    tabIndex={isFocused ? 0 : -1}
                    className="course-list-item note-list-item"
                    onFocus={() => {
                      vm.handleElementFocus(id);
                      vm.setActiveNoteIndex(listIndex);
                    }}
                    onKeyDown={(e) => handleKeyDown(e, 'note', listIndex, vm.notas.length + 1)}
                    onClick={() => navigateTo({ type: 'editor', courseId: curso.id, ambienteId, notaId: nota.id })}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px 15px', 
                      cursor: 'pointer'
                    }}
                  >
                    <div className="course-list-item-left" style={{ flex: 1 }}>
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
                  </div>
                );
              })}

              {vm.notas.length === 0 && (
                <p className="no-tasks-hint">No hay notas registradas en este ambiente. Utiliza el botón de creación anterior para empezar.</p>
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

    </div>
  );
}
