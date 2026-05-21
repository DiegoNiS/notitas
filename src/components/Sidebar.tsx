import { useEffect } from 'react';
import { useKeyboardModifiers } from '../hooks/useKeyboard'; // Importamos la magia
import { CursoDetalle } from '../services/database';

interface SidebarProps {
  isOpen: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  cursos: CursoDetalle[];
  onSelectCurso: (id: string) => void; // <--- Nueva Prop
}

export function Sidebar({ isOpen, cursos, onSelectCurso }: SidebarProps) {
  // 1. Usamos el Hook de forma súper limpia
  const { isAltShiftPressed } = useKeyboardModifiers();

  // Escuchamos el teclado solo si el Sidebar está abierto
  useEffect(() => {
    if (!isOpen) return;
    
    const handleLocalKey = (e: KeyboardEvent) => {
      // Capturamos teclas físicas (Digit1, Digit2... o Numpad1...)
      const isNumberKey = e.code.startsWith('Digit') || e.code.startsWith('Numpad');
      
      if (e.altKey && e.shiftKey && isNumberKey) {
        e.preventDefault();
        
        // Extraemos el número del texto "Digit1" o "Numpad1"
        const numero = parseInt(e.code.replace('Digit', '').replace('Numpad', ''), 10);
        const index = numero - 1;
        
        if (index >= 0 && index < cursos.length) {
          onSelectCurso(cursos[index].id); // ¡Viaje directo!
        }
      }
    };
    
    document.addEventListener('keydown', handleLocalKey);
    return () => document.removeEventListener('keydown', handleLocalKey);
  }, [isOpen, cursos, onSelectCurso]);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-content">
        
        <div className="sidebar-brand">
          <div className="shape-square"></div>
          <span className="brand-text">Notitas</span>
        </div>

        <div className="course-list">
          {cursos.map((curso, index) => (
            <div key={curso.id} className="course-item">
              <div className="course-header" title={curso.nombre}>
                
                {/* 2. Ahora depende de Alt + Shift */}
                {isOpen && isAltShiftPressed && (
                  <div className="shortcut-hint">{index + 1}</div>
                )}
                
                <div className="course-abbr">{curso.abreviatura}</div>
                <div className="course-name">{curso.nombre}</div>
              </div>

              <div className="ambiente-list">
                {/* ... código de ambientes intacto ... */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}