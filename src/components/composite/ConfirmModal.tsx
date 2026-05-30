// Ruta: src/components/composite/ConfirmModal.tsx
import { useFocusTrap } from '../../keyboard/useFocusTrap';
import { GlobalOverlay } from '../core/GlobalOverlay';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'CONFIRMAR',
  cancelText = 'CANCELAR',
  isDanger = false
}: ConfirmModalProps) {
  const modalRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  return (
    <GlobalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="modal-content" ref={modalRef} style={{ width: '400px', maxWidth: '90vw' }}>
        <div className="modal-header">
          <h3 className={isDanger ? 'brand-text text-danger' : 'brand-text'}>{title}</h3>
          <div className="shape-dash" style={{ width: '30px' }}></div>
        </div>

        <div style={{ fontSize: '0.8rem', opacity: 0.8, lineHeight: '1.4', marginBottom: '25px', textAlign: 'left', color: 'var(--text-color)' }}>
          {message}
        </div>

        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn-ghost" onClick={onClose}>{cancelText}</button>
          <button 
            type="button" 
            className={isDanger ? 'btn-danger' : 'btn-solid'} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </GlobalOverlay>
  );
}
