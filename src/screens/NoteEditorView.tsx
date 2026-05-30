// Ruta: src/screens/NoteEditorView.tsx
import { useNoteEditorViewModel } from '../viewmodels/useNoteEditorViewModel';
import { CursoDetalle, formatTaskDueDate } from '../services/database';
import { GlobalOverlay } from '../components/core/GlobalOverlay';
import { NotesSwitcher } from '../components/composite/NotesSwitcher';
import { marked } from 'marked';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';


interface NoteEditorViewProps {
  curso: CursoDetalle | null;
  notaId: string;
  onBack: () => void;
  navigateTo: (route: any) => void;
}

export function NoteEditorView({ curso, notaId, onBack, navigateTo }: NoteEditorViewProps) {
  const vm = useNoteEditorViewModel(notaId, onBack, navigateTo);

  // Helper para ordenar fechas (@DD/MM - HH:MM o @DD/MM)
  const parseTaskDueDateToNumber = (dateStr: string): number => {
    if (!dateStr) return Infinity;
    let clean = dateStr.replace(/^@/, '').trim();
    const dateRegex = /^(\d{1,2})\/(\d{1,2})(?:\s*-\s*(\d{1,2}):(\d{1,2}))?$/;
    const match = clean.match(dateRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const hour = match[3] ? parseInt(match[3], 10) : 0;
      const min = match[4] ? parseInt(match[4], 10) : 0;
      return month * 1000000 + day * 10000 + hour * 100 + min;
    }
    return Infinity;
  };

  const pendingTasks = vm.tareas
    .filter(t => t.estado !== 'completed')
    .sort((a, b) => parseTaskDueDateToNumber(a.fechaEntrega) - parseTaskDueDateToNumber(b.fechaEntrega));

  const completedTasks = vm.tareas
    .filter(t => t.estado === 'completed');

  const combinedList = [
    { type: 'create' as const },
    ...pendingTasks.map(t => ({ type: 'task' as const, task: t })),
    ...completedTasks.map(t => ({ type: 'task' as const, task: t }))
  ];

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
    } else if (e.key === 'Enter') {
      if (index === 0) {
        e.preventDefault();
        vm.setIsCreatingTask(true);
      }
    } else if (e.key === ' ' || e.code === 'Space') {
      if (index > 0) {
        e.preventDefault();
        const item = combinedList[index];
        if (item && item.type === 'task') {
          const taskId = item.task.id;
          vm.toggleTaskStatus(item.task);
          
          // Mantener foco en la misma tarea
          setTimeout(() => {
            const element = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement | null;
            if (element) {
              element.focus();
            }
          }, 50);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  };

  if (!curso || !vm.note) {
    return <div className="view-container">Cargando nota...</div>;
  }

  // Renderizador de Markdown usando la librería 'marked'
  const renderMarkdown = (markdownContent: string) => {
    // 1. Preprocesar las líneas de Tarea para convertirlas a bloques HTML estructurados
    const processed = markdownContent.split('\n').map(line => {
      const trimmed = line.trim();
      const taskRegex = /^(?::Tarea|#Tarea)\s+\[(.*?)\]\s+(.*?)(?:\s+@(.*))?$/i;
      const match = trimmed.match(taskRegex);
      
      if (match) {
        const stateChar = match[1].trim();
        const desc = match[2].trim();
        const date = match[3] ? match[3].trim() : '';

        let statusClass = 'incomplete';
        if (stateChar === '/') statusClass = 'in-progress';
        else if (stateChar.toLowerCase() === 'x') statusClass = 'completed';

        const state1 = (stateChar === '/' || stateChar.toLowerCase() === 'x') ? 'active' : '';
        const state2 = (stateChar.toLowerCase() === 'x') ? 'active' : '';
        const strike = statusClass === 'completed' ? 'text-decoration: line-through;' : '';
        const dateStr = date ? `<span class="preview-task-date brand-text" style="font-size: 0.65rem; opacity: 0.5; letter-spacing: 1px; margin-left: 8px;">${formatTaskDueDate(date)}</span>` : '';

        return `<div class="preview-task-item preview-status-${statusClass}" style="display: flex; align-items: center; font-size: 0.85rem; margin: 8px 0; opacity: ${statusClass === 'completed' ? 0.4 : 0.8};">
          <div class="task-status-squares" style="display: inline-flex; gap: 3px; margin-right: 10px;">
            <div class="status-square ${state1}" style="width: 8px; height: 8px; border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 1px;"></div>
            <div class="status-square ${state2}" style="width: 8px; height: 8px; border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 1px;"></div>
          </div>
          <span class="preview-task-desc" style="${strike}">${desc}</span>
          ${dateStr}
        </div>`;
      }
      return line;
    }).join('\n');

    // 2. Compilar Markdown estándar usando 'marked'
    let html = '';
    try {
      html = marked.parse(processed) as string;
    } catch (err) {
      console.error(err);
      html = '<p>Error al procesar Markdown</p>';
    }

    return (
      <div 
        className="markdown-body" 
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    );
  };

  return (

    <div className="view-container slide-left-enter course-view-container">
      
      {/* Indicador de regreso espacial */}
      <div className="navigation-hint left-hint" onClick={vm.handleBack} style={{ cursor: 'pointer' }}>
        <div className="shape-triangle left"></div>
      </div>
      
      {/* Encabezado */}
      <div className="course-view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '15px', marginBottom: '25px' }}>
        <div className="view-header-layout" style={{ borderBottom: 'none', paddingBottom: 0, margin: 0, flex: 1, marginRight: '20px' }}>
          <div className="view-header-titles">
            <span className="view-header-category">EDITOR DE NOTAS</span>
            <h2 className="view-header-title">{vm.note.titulo.toUpperCase()}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="view-header-subtitle">CURSO: {curso.nombre.toUpperCase()}</span>
              <span style={{ 
                fontSize: '0.6rem', 
                opacity: vm.savingStatus === 'saving' ? 0.8 : vm.savingStatus === 'unsaved' ? 0.45 : 0.2, 
                letterSpacing: '1.5px', 
                textTransform: 'uppercase', 
                color: 'var(--text-color)',
                fontWeight: 600
              }}>
                • {vm.savingStatus === 'saving' ? 'Guardando...' : vm.savingStatus === 'unsaved' ? 'Sin guardar' : 'Guardado'}
              </span>
            </div>
          </div>
          <div className="view-header-decor">
            <div className="shape-dash"></div>
          </div>
        </div>
        
        {/* Toggle de Modo */}
        <button 
          className="btn-ghost" 
          onClick={vm.toggleMode}
          tabIndex={-1}
          style={{ fontSize: '0.7rem', padding: '6px 12px', letterSpacing: '1px' }}
        >
          {vm.mode === 'editor' ? 'VER TAREAS' : 'VER EDITOR'}
        </button>

      </div>

      <div className="course-view-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, height: '100%' }}>
        
        {vm.mode === 'editor' ? (
          /* MODO EDITOR EN PANTALLA DIVIDIDA (SPLIT SCREEN) */
          <div className="editor-split-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', flex: 1, height: 'calc(100vh - 150px)' }}>
            
            {/* Columna Izquierda: Input CodeMirror */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <CodeMirror
                value={vm.markdown}
                height="100%"
                theme="dark"
                extensions={[markdown(), vm.isLineWrapping ? EditorView.lineWrapping : []]}
                onChange={(val) => vm.handleMarkdownChange(val)}
                className="markdown-editor-codemirror"
                placeholder="# Título de la Nota\n\nEscribe tu nota aquí..."
                autoFocus
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: false,
                  dropCursor: true,
                  allowMultipleSelections: false,
                  indentOnInput: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  syntaxHighlighting: true,
                  highlightActiveLine: false,
                  highlightSelectionMatches: false
                }}
              />
            </div>
            
            {/* Columna Derecha: Live Preview */}
            <div 
              className="editor-preview-pane" 
              style={{ 
                flex: 1, 
                height: '100%', 
                overflowY: 'auto', 
                padding: '20px 0 20px 20px', 
                borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
                boxSizing: 'border-box' 
              }}
            >
              {renderMarkdown(vm.markdown)}
            </div>

          </div>
        ) : (
          /* MODO TAREAS */
          <div className="course-view-main" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>TAREAS ASOCIADAS A LA NOTA</h3>
            </div>

            <div className="tasks-list">
              {/* Botón de creación integrado en la lista como editor-task-0 */}
              <div
                id="editor-task-0"
                tabIndex={vm.activeTaskIndex === 0 ? 0 : -1}
                className="course-list-item task-list-item create-button-item"
                onFocus={() => {
                  vm.handleElementFocus('editor-task-0');
                  vm.setActiveTaskIndex(0);
                }}
                onKeyDown={(e) => handleKeyDown(e, 0, combinedList.length)}
                onClick={() => vm.setIsCreatingTask(true)}
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  padding: '15px 20px',
                  cursor: 'pointer',
                  marginBottom: '15px'
                }}
              >
                <span className="brand-text" style={{ fontSize: '0.85rem', letterSpacing: '1.5px' }}>
                  [+] NUEVA TAREA
                </span>
              </div>

              {/* Sección 1: Tareas Pendientes */}
              <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                <span className="brand-text" style={{ fontSize: '0.65rem', opacity: 0.35, letterSpacing: '2px', paddingLeft: '20px' }}>
                  PENDIENTES ({pendingTasks.length})
                </span>
              </div>

              {pendingTasks.map((task, index) => {
                const listIndex = index + 1;
                const id = `editor-task-${listIndex}`;
                const isFocused = listIndex === vm.activeTaskIndex;
                
                return (
                  <div 
                    key={task.id} 
                    id={id}
                    data-task-id={task.id}
                    tabIndex={isFocused ? 0 : -1}
                    className={`course-list-item task-list-item status-${task.estado}`}
                    onFocus={() => {
                      vm.handleElementFocus(id);
                      vm.setActiveTaskIndex(listIndex);
                    }}
                    onKeyDown={(e) => handleKeyDown(e, listIndex, combinedList.length)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '15px 20px', gap: '10px' }}
                  >
                    <div className="course-list-item-left" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      
                      {/* Fila Superior: Descripción */}
                      <span className="task-description" style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'none', color: '#ffffff' }}>
                        {task.descripcion}
                      </span>

                      {/* Fila Inferior: Fecha/Hora de entrega y Cuadritos de estado */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span className="task-due-date brand-text" style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '2px' }}>
                          {formatTaskDueDate(task.fechaEntrega) || 'SIN FECHA'}
                        </span>

                        <div 
                          className="task-status-squares" 
                          onClick={(e) => {
                            e.stopPropagation();
                            vm.toggleTaskStatus(task);
                          }}
                          style={{ display: 'flex', gap: '4px' }}
                        >
                          <div className={`status-square ${task.estado === 'in_progress' ? 'active' : ''}`}></div>
                          <div className="status-square"></div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}

              {pendingTasks.length === 0 && (
                <p className="no-tasks-hint" style={{ paddingLeft: '20px', margin: '10px 0 20px 0' }}>No hay tareas pendientes en esta nota.</p>
              )}

              {/* Línea divisoria elegante entre pendientes y completadas */}
              {completedTasks.length > 0 && (
                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.05)', margin: '25px 20px 15px 20px' }}></div>
              )}

              {/* Sección 2: Tareas Culminadas */}
              {completedTasks.length > 0 && (
                <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                  <span className="brand-text" style={{ fontSize: '0.65rem', opacity: 0.35, letterSpacing: '2px', paddingLeft: '20px' }}>
                    CULMINADAS ({completedTasks.length})
                  </span>
                </div>
              )}

              {completedTasks.map((task, index) => {
                const listIndex = pendingTasks.length + index + 1;
                const id = `editor-task-${listIndex}`;
                const isFocused = listIndex === vm.activeTaskIndex;
                
                return (
                  <div 
                    key={task.id} 
                    id={id}
                    data-task-id={task.id}
                    tabIndex={isFocused ? 0 : -1}
                    className="course-list-item task-list-item status-completed"
                    onFocus={() => {
                      vm.handleElementFocus(id);
                      vm.setActiveTaskIndex(listIndex);
                    }}
                    onKeyDown={(e) => handleKeyDown(e, listIndex, combinedList.length)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '15px 20px', gap: '10px', opacity: 0.4 }}
                  >
                    <div className="course-list-item-left" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      
                      {/* Fila Superior: Descripción (con tachado) */}
                      <span className="task-description" style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'none', color: '#ffffff', textDecoration: 'line-through' }}>
                        {task.descripcion}
                      </span>

                      {/* Fila Inferior: Fecha/Hora de entrega y Cuadritos de estado */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span className="task-due-date brand-text" style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '2px' }}>
                          {formatTaskDueDate(task.fechaEntrega) || 'SIN FECHA'}
                        </span>

                        <div 
                          className="task-status-squares" 
                          onClick={(e) => {
                            e.stopPropagation();
                            vm.toggleTaskStatus(task);
                          }}
                          style={{ display: 'flex', gap: '4px' }}
                        >
                          <div className="status-square active"></div>
                          <div className="status-square active"></div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
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
                <button type="button" className="btn-ghost" tabIndex={-1} onClick={() => vm.setIsCreatingTask(false)}>CANCELAR</button>
                <button type="submit" className="btn-solid" tabIndex={-1}>CREAR TAREA</button>
              </div>
            </form>
          </div>
        </GlobalOverlay>
      )}
      {/* Popups / Toast Notifications */}
      <div className="toast-container">
        {vm.toasts.map(toast => (
          <div key={toast.id} className="toast-item">
            <div className="toast-icon-circle"></div>
            <div className="toast-content" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="brand-text" style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ffffff', letterSpacing: '1px' }}>
                {toast.title}
              </span>
              <span style={{ fontSize: '0.65rem', opacity: 0.5, textTransform: 'none', color: 'var(--text-color)' }}>
                {toast.description}
              </span>
            </div>
          </div>
        ))}
      </div>

      <NotesSwitcher
        isOpen={vm.switcher.isOpen}
        onClose={vm.switcher.close}
        items={vm.notesInEnv}
        onSelectNote={(nota) => navigateTo({
          type: 'editor',
          courseId: curso?.id || '',
          ambienteId: vm.note?.ambiente_id || '',
          notaId: nota.id
        })}
        selectedIndex={vm.switcher.selectedIndex}
      />

    </div>
  );
}
