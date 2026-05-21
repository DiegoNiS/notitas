// Ruta: src/components/QuickSwitcher.tsx
import { CursoDetalle } from '../services/database';
import { GenericSwitcher } from './GenericSwitcher';

interface QuickSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIndex: number;
  cursos: CursoDetalle[];
  onSelectCurso: (cursoId: string) => void; // <--- NUEVA PROP: La acción a ejecutar
}

export function QuickSwitcher({ isOpen, onClose, selectedIndex, cursos, onSelectCurso }: QuickSwitcherProps) {
  
  return (
    <GenericSwitcher
      isOpen={isOpen}
      onClose={onClose}
      title="NAVEGADOR RÁPIDO"
      items={cursos}
      selectedIndex={selectedIndex}
      renderItem={(curso, isSelected) => (
        <div 
          key={curso.id} 
          className={`switcher-item ${isSelected ? 'selected' : ''}`}
          // NUEVO: Al hacer clic, ejecuta la acción y cierra el modal
          onClick={() => {
            onSelectCurso(curso.id);
            onClose();
          }}
          style={{ cursor: 'pointer' }} // Un pequeño fix visual
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