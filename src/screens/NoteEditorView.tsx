// Ruta: src/screens/NoteEditorView.tsx
import { useNoteEditorViewModel } from '../viewmodels/useNoteEditorViewModel';
import { CursoDetalle } from '../services/database';
import { GlobalOverlay } from '../components/core/GlobalOverlay';

interface NoteEditorViewProps {
  curso: CursoDetalle | null;
  ambienteId: string;
  notaId: string;
  onBack: () => void;
}

export function NoteEditorView({ curso, notaId, onBack }: NoteEditorViewProps) {
  const vm = useNoteEditorViewModel(notaId, onBack);

  // Manejador de navegación con las flechas Arriba y Abajo, Enter y Space en lista de tareas
  const handleKeyDown = (
    e: React.KeyboardEvent, 
    index: number, 
    maxLength: number
  ) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % maxLength;
      const nextId = `editor-task-${nextIndex}`;
      vm.setActiveTaskIndex(nextIndex);
      document.getElementById(nextId)?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + maxLength) % maxLength;
      const prevId = `editor-task-${prevIndex}`;
      vm.setActiveTaskIndex(prevIndex);
      document.getElementById(prevId)?.focus();
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      const task = vm.tareas[index];
      if (task) {
        vm.toggleTaskStatus(task);
      }
    }
  };

  if (!curso || !vm.note) {
    return <div className="view-container">Cargando nota...</div>;
  }

  return (
    <div className="view-container slide-left-enter course-view-container">
      
      {/* Indicador de regreso espacial */}
      <div className="navigation-hint left-hint" onClick={onBack} style={{ cursor: 'pointer' }}>
        <div className="shape-triangle left"></div>
      </div>
      
      {/* Encabezado */}
      <div className="course-view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="brand-text">
            {curso.nombre.toUpperCase()} - {vm.note.titulo.toUpperCase()}
          </h2>
          <div className="shape-dash"></div>
        </div>
        
        {/* Toggle de Modo */}
        <button 
          className="btn-ghost" 
          onClick={vm.toggleMode}
          style={{ fontSize: '0.7rem', padding: '6px 12px', letterSpacing: '1px' }}
        >
          {vm.mode === 'editor' ? '[Alt+Tab] VER TAREAS' : '[Alt+Tab] VER EDITOR'}
        </button>
      </div>

      <div className="course-view-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, height: '100%' }}>
        
        {vm.mode === 'editor' ? (
          /* MODO EDITOR */
          <div className="editor-mode-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <textarea
              id="markdown-editor"
              className="markdown-editor-textarea"
              value={vm.markdown}
              onChange={(e) => vm.handleMarkdownChange(e.target.value)}
              placeholder="# Título de la Nota&#10;&#10;Escribe tu nota aquí..."
              autoFocus
              style={{
                flex: 1,
                width: '100%',
                minHeight: '400px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                resize: 'none',
                opacity: 0.8,
                padding: '20px 0'
              }}
            />
          </div>
        ) : (
          /* MODO TAREAS */
          <div className="course-view-main" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>TAREAS ASOCIADAS A LA NOTA</h3>
              <button 
                className="btn-ghost" 
                onClick={() => vm.setIsCreatingTask(true)} 
                style={{ fontSize: '0.65rem', letterSpacing: '1px', padding: '4px 8px' }}
              >
                [+] NUEVA TAREA
              </button>
            </div>

            <div className="tasks-list">
              {vm.tareas.map((task, index) => {
                const id = `editor-task-${index}`;
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
                    onKeyDown={(e) => handleKeyDown(e, index, vm.tareas.length)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '15px 20px', gap: '10px' }}
                  >
                    <div className="course-list-item-left" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      
                      {/* Fila Superior: Descripción */}
                      <span className="task-description" style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'none', color: '#ffffff' }}>
                        {task.descripcion}
                      </span>

                      {/* Fila Inferior: Fecha/Hora de entrega y Cuadritos de estado juntos */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span className="task-due-date brand-text" style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '2px' }}>
                          {cleanedDate || 'SIN FECHA'}
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
                <p className="no-tasks-hint">No hay tareas creadas dentro de esta nota en Markdown. Escribe líneas con `:Tarea [ ]` en el editor.</p>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Modal para Crear Nueva Tarea desde Modo Tareas */}
      {vm.isCreatingTask && (
        <GlobalOverlay isOpen={vm.isCreatingTask} onClose={() => vm.setIsCreatingTask(false)}>
          <div className="modal-content" style={{ width: '420px' }}>
            <div className="modal-header">
              <h3 className="brand-text">NUEVA TAREA</h3>
              <div className="shape-dash" style={{ width: '25px' }}></div>
            </div>
            
            <form 
              className="minimal-form" 
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const descripcion = data.get('descripcion') as string;
                const fechaEntrega = data.get('fechaEntrega') as string;
                if (descripcion) {
                  vm.handleAgregarTarea(descripcion, fechaEntrega);
                }
              }}
            >
              <div className="form-group">
                <label>DESCRIPCIÓN</label>
                <input type="text" name="descripcion" placeholder="Ej. Terminar ejercicio 3 de arquitectura hexagonal" required autoFocus />
              </div>
              
              <div className="form-group">
                <label>FECHA / HORA DE ENTREGA (OPCIONAL)</label>
                <input type="text" name="fechaEntrega" placeholder="Ej. miércoles 12 - 16:40" />
              </div>

              <div className="modal-actions" style={{ marginTop: '25px' }}>
                <button type="button" className="btn-ghost" onClick={() => vm.setIsCreatingTask(false)}>CANCELAR</button>
                <button type="submit" className="btn-solid">CREAR TAREA</button>
              </div>
            </form>
          </div>
        </GlobalOverlay>
      )}

    </div>
  );
}
