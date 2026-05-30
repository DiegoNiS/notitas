// Ruta: src/components/composite/EditarCursoModal.tsx
import { useState, useEffect } from 'react';
import { useFocusTrap } from '../../keyboard/useFocusTrap';
import { GlobalOverlay } from '../core/GlobalOverlay';
import { db, CursoDetalle, Ambiente } from '../../services/database';
import { ConfirmModal } from './ConfirmModal';

interface EditarCursoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  curso: CursoDetalle | null;
}

export function EditarCursoModal({ isOpen, onClose, onSuccess, curso }: EditarCursoModalProps) {
  const modalRef = useFocusTrap(isOpen);

  const [nombre, setNombre] = useState('');
  const [abreviatura, setAbreviatura] = useState('');
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [nuevoAmbienteNombre, setNuevoAmbienteNombre] = useState('');

  // Estados para renombrar ambiente inline
  const [editingAmbienteId, setEditingAmbienteId] = useState<string | null>(null);
  const [editingAmbienteNombre, setEditingAmbienteNombre] = useState('');

  // Estado para confirmación de eliminación de ambiente
  const [envParaEliminar, setEnvParaEliminar] = useState<Ambiente | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && curso) {
      setNombre(curso.nombre);
      setAbreviatura(curso.abreviatura);
      cargarAmbientes();
    }
  }, [isOpen, curso]);

  const cargarAmbientes = async () => {
    if (!curso) return;
    try {
      const data = await db.obtenerAmbientesPorCurso(curso.id);
      setAmbientes(data);
    } catch (e) {
      console.error('Error al cargar ambientes del curso:', e);
    }
  };

  const handleAgregarAmbiente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curso || !nuevoAmbienteNombre.trim()) return;

    try {
      await db.agregarAmbiente(curso.id, nuevoAmbienteNombre.trim());
      setNuevoAmbienteNombre('');
      cargarAmbientes();
    } catch (e) {
      console.error('Error al agregar ambiente:', e);
    }
  };

  const handleIniciarEdicionAmbiente = (env: Ambiente) => {
    setEditingAmbienteId(env.id);
    setEditingAmbienteNombre(env.nombre);
  };

  const handleGuardarRenombrarAmbiente = async (envId: string) => {
    if (!curso || !editingAmbienteNombre.trim()) return;
    try {
      await db.renameAmbiente(curso.id, envId, editingAmbienteNombre.trim());
      setEditingAmbienteId(null);
      cargarAmbientes();
    } catch (e) {
      console.error('Error al renombrar ambiente:', e);
    }
  };

  const handleEliminarAmbienteConfirmado = async () => {
    if (!curso || !envParaEliminar) return;
    try {
      await db.eliminarAmbiente(curso.id, envParaEliminar.id);
      setEnvParaEliminar(null);
      cargarAmbientes();
    } catch (e) {
      console.error('Error al eliminar ambiente:', e);
    }
  };

  const handleSubmitCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curso || !nombre.trim() || !abreviatura.trim()) return;

    setIsSubmitting(true);
    try {
      await db.actualizarCurso(curso.id, nombre.trim(), abreviatura.trim());
      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (e) {
      console.error('Error al guardar curso:', e);
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !curso) return null;

  return (
    <>
      <GlobalOverlay isOpen={isOpen} onClose={onClose}>
        <div className="modal-content" ref={modalRef} style={{ width: '480px', maxWidth: '95vw' }}>
          <div className="modal-header">
            <h3 className="brand-text">EDITAR CURSO</h3>
            <div className="shape-dash" style={{ width: '30px' }}></div>
          </div>

          <form className="minimal-form" onSubmit={handleSubmitCurso}>
            <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ width: '90px' }}>
                <label>ABREVIATURA</label>
                <input 
                  type="text" placeholder="Ej. MAT" maxLength={5} required autoFocus
                  value={abreviatura} 
                  onChange={(e) => setAbreviatura(e.target.value.toUpperCase())}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>NOMBRE COMPLETO</label>
                <input 
                  type="text" placeholder="Ej. Matemática Discreta" required 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
            </div>

            {/* Gestión de Ambientes */}
            <div className="form-group" style={{ marginTop: '15px' }}>
              <label>AMBIENTES ASOCIADOS</label>
              
              {/* Lista de ambientes existentes */}
              <div className="edit-env-list">
                {ambientes.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', opacity: 0.4, padding: '10px', textAlign: 'center' }}>
                    No hay ambientes asignados.
                  </div>
                ) : (
                  ambientes.map(env => (
                    <div key={env.id} className="edit-env-item">
                      {editingAmbienteId === env.id ? (
                        <input 
                          type="text" 
                          value={editingAmbienteNombre} 
                          onChange={(e) => setEditingAmbienteNombre(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleGuardarRenombrarAmbiente(env.id);
                            } else if (e.key === 'Escape') {
                              setEditingAmbienteId(null);
                            }
                          }}
                          autoFocus
                          style={{ flex: 1, marginRight: '10px' }}
                        />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-color)' }}>{env.nombre}</span>
                      )}

                      <div className="edit-env-item-actions">
                        {editingAmbienteId === env.id ? (
                          <>
                            <button 
                              type="button" 
                              className="edit-env-btn"
                              onClick={() => handleGuardarRenombrarAmbiente(env.id)}
                            >
                              Guardar
                            </button>
                            <button 
                              type="button" 
                              className="edit-env-btn"
                              onClick={() => setEditingAmbienteId(null)}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              type="button" 
                              className="edit-env-btn"
                              onClick={() => handleIniciarEdicionAmbiente(env)}
                            >
                              Editar
                            </button>
                            {/* Evitamos que se queden cursos sin ningún ambiente si es posible, pero permitimos eliminar */}
                            <button 
                              type="button" 
                              className="edit-env-btn danger"
                              onClick={() => setEnvParaEliminar(env)}
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Agregar nuevo ambiente */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Nuevo ambiente (ej. Laboratorio)" 
                  value={nuevoAmbienteNombre}
                  onChange={(e) => setNuevoAmbienteNombre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAgregarAmbiente(e);
                    }
                  }}
                  style={{ flex: 1, fontSize: '0.75rem', padding: '6px 12px' }}
                />
                <button 
                  type="button" 
                  className="btn-solid" 
                  style={{ padding: '6px 15px', fontSize: '0.7rem' }}
                  onClick={handleAgregarAmbiente}
                >
                  AÑADIR
                </button>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '25px' }}>
              <button type="button" className="btn-ghost" onClick={onClose}>CANCELAR</button>
              <button type="submit" className="btn-solid" disabled={isSubmitting}>
                {isSubmitting ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
              </button>
            </div>
          </form>
        </div>
      </GlobalOverlay>

      {/* Confirmación para Eliminar un Ambiente */}
      <ConfirmModal 
        isOpen={envParaEliminar !== null}
        onClose={() => setEnvParaEliminar(null)}
        onConfirm={handleEliminarAmbienteConfirmado}
        title="ELIMINAR AMBIENTE"
        message={`Esta acción eliminará de forma permanente el ambiente "${envParaEliminar?.nombre}" y TODAS las notas y tareas asociadas a él (incluyendo archivos de notas locales en disco). Esta operación no se puede deshacer. ¿Deseas continuar?`}
        confirmText="ELIMINAR AMBIENTE"
        isDanger={true}
      />
    </>
  );
}
