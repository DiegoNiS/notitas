// Ruta: src/components/NewCourseModal.tsx
import { useFocusTrap } from '../keyboard/useFocusTrap';
import { GlobalOverlay } from './GlobalOverlay';
import { useNewCourseViewModel } from '../viewmodels/useNewCourseViewModel';

interface NewCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewCourseModal({ isOpen, onClose, onSuccess }: NewCourseModalProps) {
  // 1. Inyectamos la lógica
  const vm = useNewCourseViewModel(isOpen, onSuccess, onClose);
  
  // 2. Trampa de accesibilidad
  const modalRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  return (
    <GlobalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="modal-content" ref={modalRef}>
        
        <div className="modal-header">
          <div className="shape-plus" style={{ width: '16px', height: '16px', opacity: 0.5 }}></div>
          <h3 className="brand-text">NUEVO CURSO</h3>
        </div>
        
        <div className="shape-dash" style={{ marginBottom: '25px', width: '30px' }}></div>

        <form className="minimal-form" onSubmit={vm.handleSubmit}>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>ABREVIATURA</label>
              <input 
                type="text" placeholder="Ej. ISW" maxLength={5} required autoFocus
                value={vm.abreviatura} 
                onChange={(e) => vm.setAbreviatura(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="form-group">
            <label>NOMBRE COMPLETO</label>
            <input 
              type="text" placeholder="Ej. Ingeniería de Software III" required 
              value={vm.nombre} 
              onChange={(e) => vm.setNombre(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginTop: '10px' }}>
            <label>AMBIENTES ASIGNADOS</label>
            <div className="checkbox-grid">
              {vm.ambientesDB.map(amb => (
                <label key={amb.id} className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={vm.ambientesSeleccionados.includes(amb.id)}
                    onChange={() => vm.toggleAmbiente(amb.id)}
                  />
                  <div className="checkbox-custom"></div>
                  <span>{amb.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '30px' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>CANCELAR</button>
            <button type="submit" className="btn-solid" disabled={vm.isSubmitting}>
              {vm.isSubmitting ? 'CREANDO...' : 'CREAR CURSO'}
            </button>
          </div>
          
        </form>
      </div>
    </GlobalOverlay>
  );
}