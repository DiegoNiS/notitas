import { useEffect, useState } from 'react';
import { db, Ambiente } from '../services/database';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { GlobalOverlay } from './GlobalOverlay'; // Nuestro Wrapper Maestro

interface NewCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewCourseModal({ isOpen, onClose, onSuccess }: NewCourseModalProps) {
  const [ambientesDB, setAmbientesDB] = useState<Ambiente[]>([]);
  const [abreviatura, setAbreviatura] = useState('');
  const [nombre, setNombre] = useState('');
  const [ambientesSeleccionados, setAmbientesSeleccionados] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializamos la trampa de foco
  const modalRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (isOpen) {
      db.obtenerAmbientesBase().then(data => setAmbientesDB(data));
      setAbreviatura('');
      setNombre('');
      setAmbientesSeleccionados([]);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const toggleAmbiente = (id: string) => {
    setAmbientesSeleccionados(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await db.crearCurso(abreviatura, nombre, ambientesSeleccionados);
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <GlobalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="modal-content" ref={modalRef}>
        
        <div className="modal-header">
          <div className="shape-plus" style={{ width: '16px', height: '16px', opacity: 0.5 }}></div>
          <h3 className="brand-text">NUEVO CURSO</h3>
        </div>
        
        <div className="shape-dash" style={{ marginBottom: '25px', width: '30px' }}></div>

        <form className="minimal-form" onSubmit={handleSubmit}>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>ABREVIATURA</label>
              <input 
                type="text" placeholder="Ej. ISW" maxLength={5} required autoFocus
                value={abreviatura} onChange={(e) => setAbreviatura(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="form-group">
            <label>NOMBRE COMPLETO</label>
            <input 
              type="text" placeholder="Ej. Ingeniería de Software III" required 
              value={nombre} onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginTop: '10px' }}>
            <label>AMBIENTES ASIGNADOS</label>
            <div className="checkbox-grid">
              {ambientesDB.map(amb => (
                <label key={amb.id} className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={ambientesSeleccionados.includes(amb.id)}
                    onChange={() => toggleAmbiente(amb.id)}
                  />
                  <div className="checkbox-custom"></div>
                  <span>{amb.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '30px' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>CANCELAR</button>
            <button type="submit" className="btn-solid" disabled={isSubmitting}>
              {isSubmitting ? 'CREANDO...' : 'CREAR CURSO'}
            </button>
          </div>
          
        </form>
      </div>
    </GlobalOverlay>
  );
}