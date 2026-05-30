// Ruta: src/components/composite/TasksSwitcher.tsx
import { GenericSwitcher } from '../core/GenericSwitcher';
import { TareaDetail } from '../../services/database';

interface TasksSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  items: TareaDetail[];
  onSelectTask: (tarea: TareaDetail) => void;
  selectedIndex: number;
}

export function TasksSwitcher({ isOpen, onClose, items, onSelectTask, selectedIndex }: TasksSwitcherProps) {
  return (
    <GenericSwitcher
      isOpen={isOpen}
      onClose={onClose}
      title="NAVEGADOR DE TAREAS"
      items={items}
      selectedIndex={selectedIndex}
      renderItem={(tarea, isSelected) => (
        <div 
          key={tarea.id} 
          className={`switcher-item ${isSelected ? 'selected' : ''}`}
          onClick={() => {
            onSelectTask(tarea);
            onClose();
          }}
          style={{ cursor: 'pointer' }}
        >
          <span className="switcher-abbr" style={{ fontSize: '0.65rem', padding: '2px 6px', marginRight: '10px' }}>
            {tarea.ambienteNombre.toUpperCase()}
          </span>
          <span className="switcher-name" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tarea.descripcion}
          </span>
          
          {isSelected && (
             <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-color)' }} />
          )}
        </div>
      )}
    />
  );
}
