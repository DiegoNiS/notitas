// Ruta: src/components/composite/NotesSwitcher.tsx
import { GenericSwitcher } from '../core/GenericSwitcher';
import { Nota } from '../../services/database';

interface NotesSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  items: Nota[];
  onSelectNote: (nota: Nota) => void;
  selectedIndex: number;
}

export function NotesSwitcher({ isOpen, onClose, items, onSelectNote, selectedIndex }: NotesSwitcherProps) {
  return (
    <GenericSwitcher
      isOpen={isOpen}
      onClose={onClose}
      title="NAVEGADOR DE NOTAS"
      items={items}
      selectedIndex={selectedIndex}
      renderItem={(nota, isSelected) => (
        <div 
          key={nota.id} 
          className={`switcher-item ${isSelected ? 'selected' : ''}`}
          onClick={() => {
            onSelectNote(nota);
            onClose();
          }}
          style={{ cursor: 'pointer' }}
        >
          <span className="switcher-name">{nota.titulo}</span>
          
          {isSelected && (
             <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-color)' }} />
          )}
        </div>
      )}
    />
  );
}
