// Ruta: src/components/composite/ShortcutHelpModal.tsx
import { useFocusTrap } from '../../keyboard/useFocusTrap';
import { GlobalOverlay } from '../core/GlobalOverlay';
import { ShortcutManager } from '../../keyboard/ShortcutManager';
import { ShortcutConfig } from '../../keyboard/types';

interface ShortcutHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GROUP_NAMES: Record<string, string> = {
  global_navigation: 'Navegación Global',
  sidebar: 'Barra Lateral',
  welcomeScreen: 'Bienvenida / Inicio',
  dashboard: 'Panel de Cursos (Dashboard)',
  courseView: 'Vista del Curso',
  environmentView: 'Vista del Ambiente',
  noteEditorView: 'Editor de Notas',
};

export function ShortcutHelpModal({ isOpen, onClose }: ShortcutHelpModalProps) {
  const modalRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  const activeShortcutsMap = ShortcutManager.getActiveShortcuts();
  const groups = Array.from(activeShortcutsMap.entries());

  const formatShortcutKey = (cfg: ShortcutConfig): string => {
    if (cfg.keyDisplay) return cfg.keyDisplay;
    const parts: string[] = [];
    if (cfg.ctrlKey) parts.push('Ctrl');
    if (cfg.altKey) parts.push('Alt');
    if (cfg.shiftKey) parts.push('Shift');
    
    if (cfg.code) {
      let key = cfg.code;
      if (key.startsWith('Key')) key = key.substring(3);
      else if (key.startsWith('Digit')) key = key.substring(5);
      else if (key.startsWith('Numpad')) key = 'Num ' + key.substring(6);
      else if (key === 'ArrowUp') key = '↑';
      else if (key === 'ArrowDown') key = '↓';
      else if (key === 'ArrowLeft') key = '←';
      else if (key === 'ArrowRight') key = '→';
      else if (key === 'Escape') key = 'Esc';
      else if (key === 'Enter') key = 'Enter';
      else if (key === 'Space') key = 'Espacio';
      else if (key === 'Tab') key = 'Tab';
      parts.push(key);
    } else {
      parts.push('Atajo');
    }
    return parts.join(' + ');
  };

  return (
    <GlobalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="modal-content" ref={modalRef} style={{ width: '550px', maxWidth: '90vw' }}>
        <div className="modal-header" style={{ marginBottom: '15px' }}>
          <h3 className="brand-text">ATAJOS DE TECLADO</h3>
          <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>F1</span>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
          {groups.length === 0 ? (
            <p style={{ opacity: 0.5, textAlign: 'center', margin: '20px 0', fontSize: '0.8rem' }}>
              No hay atajos activos en este momento.
            </p>
          ) : (
            groups.map(([groupId, shortcuts]) => {
              const documentedShortcuts = shortcuts.filter(s => s.description);
              if (documentedShortcuts.length === 0) return null;

              return (
                <div key={groupId} style={{ marginBottom: '22px' }}>
                  <h4 style={{ 
                    fontSize: '0.68rem', 
                    letterSpacing: '1.5px', 
                    borderBottom: '1px solid rgba(255,255,255,0.06)', 
                    paddingBottom: '6px', 
                    marginBottom: '10px', 
                    textTransform: 'uppercase', 
                    fontWeight: 700,
                    opacity: 0.5,
                    color: 'var(--text-color)'
                  }}>
                    {GROUP_NAMES[groupId] || groupId}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {documentedShortcuts.map((cfg, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span style={{ opacity: 0.8, color: 'var(--text-color)' }}>{cfg.description}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {formatShortcutKey(cfg).split(' + ').map((keyPart, j) => (
                            <kbd key={j} style={{ 
                              background: 'rgba(255,255,255,0.06)', 
                              border: '1px solid rgba(255,255,255,0.12)', 
                              borderRadius: '3px', 
                              padding: '2px 6px', 
                              fontSize: '0.65rem', 
                              fontFamily: 'monospace',
                              color: '#fff',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}>
                              {keyPart}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: '20px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-ghost" onClick={onClose}>CERRAR</button>
        </div>
      </div>
    </GlobalOverlay>
  );
}
