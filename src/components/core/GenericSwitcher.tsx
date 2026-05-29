// Ruta: src/components/core/GenericSwitcher.tsx
import { ReactNode } from 'react';
import { GlobalOverlay } from './GlobalOverlay';

// Usamos <T> (Genéricos de TypeScript) para que acepte cualquier tipo de objeto (Cursos, Notas, etc.)
interface GenericSwitcherProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: T[];
  selectedIndex: number;
  // Esta es la magia: una función que le dice cómo dibujar cada ítem
  renderItem: (item: T, isSelected: boolean) => ReactNode; 
}

export function GenericSwitcher<T>({ 
  isOpen, 
  onClose, 
  title, 
  items, 
  selectedIndex, 
  renderItem 
}: GenericSwitcherProps<T>) {
  
  if (!isOpen) return null;

  return (
    <GlobalOverlay isOpen={isOpen} onClose={onClose} zIndex={10005}>
      <div className="quick-switcher">
        
        <h3 className="brand-text" style={{ fontSize: '0.75rem', opacity: 0.5 }}>
          {title.toUpperCase()}
        </h3>
        
        <div className="shape-dash" style={{ margin: '10px 0 15px 0' }}></div>
        
        <div className="switcher-list">
          {/* Iteramos de forma agnóstica y dejamos que el componente padre decida el diseño interno */}
          {items.map((item, index) => renderItem(item, index === selectedIndex))}
        </div>

      </div>
    </GlobalOverlay>
  );
}