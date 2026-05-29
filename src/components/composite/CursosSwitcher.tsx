// Ruta: src/components/composite/CursosSwitcher.tsx
import { GenericSwitcher } from '../core/GenericSwitcher';
import { CursoDetalle } from '../../services/database';

interface CursosSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  cursos: CursoDetalle[];
  onSelectCurso: (id: string) => void;
  selectedIndex: number;
}

export function CursosSwitcher({ isOpen, onClose, cursos, onSelectCurso, selectedIndex }: CursosSwitcherProps) {

  return (
    <GenericSwitcher
      isOpen={isOpen}
      onClose={onClose}
      title="NAVEGADOR DE CURSOS"
      items={cursos}
      selectedIndex={selectedIndex}
      renderItem={(curso, isSelected) => (
        <div 
          key={curso.id} 
          className={`switcher-item ${isSelected ? 'selected' : ''}`}
          onClick={() => {
            onSelectCurso(curso.id);
            onClose();
          }}
          style={{ cursor: 'pointer' }}
        >
          <span className="switcher-abbr">{curso.abreviatura}</span>
          <span className="switcher-name">{curso.nombre}</span>
          
          {isSelected && (
             <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-color)' }} />
          )}
        </div>
      )}
    />
  );
}
