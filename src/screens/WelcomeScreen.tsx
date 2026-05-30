// Ruta: src/screens/WelcomeScreen.tsx
import { useWelcomeScreenViewModel } from '../viewmodels/useWelcomeScreenViewModel';
import { AppRoute } from '../navigation/types';
import { CursoDetalle } from '../services/database';
import { CursosSwitcher } from '../components/composite/CursosSwitcher';
import { GlobalOverlay } from '../components/core/GlobalOverlay';

interface WelcomeScreenProps {
  navigateTo: (route: AppRoute) => void;
  cursos: CursoDetalle[];
}

export function WelcomeScreen({ navigateTo, cursos }: WelcomeScreenProps) {
  const vm = useWelcomeScreenViewModel(cursos, navigateTo);

  return (
    <div className="view-container fade-enter welcome-container">
      {/* Buscador de Cursos global (se activa con Ctrl + Tab) */}
      <CursosSwitcher 
        isOpen={vm.switcher.isOpen} 
        onClose={vm.switcher.close} 
        cursos={cursos} 
        onSelectCurso={(id) => navigateTo({ type: 'course', courseId: id })} 
        selectedIndex={vm.switcher.selectedIndex}
      />

      <div className="shape-square welcome-icon"></div>
      
      <h1 className="brand-text welcome-title">
        BIENVENIDO, {vm.nombreUsuario ? vm.nombreUsuario.toUpperCase() : '...'}
      </h1>
      
      <p className="welcome-subtitle">
        Presiona <kbd>↓</kbd> para iniciar o <kbd>Ctrl + Tab</kbd> para buscar curso.
      </p>

      <div className="navigation-hint bottom-hint">
        <div className="shape-triangle down"></div>
      </div>

      {vm.nombreUsuario === '' && (
        <GlobalOverlay isOpen={true} onClose={() => {}} zIndex={10006}>
          <div className="modal-content" style={{ width: '380px' }}>
            <div className="modal-header">
              <h3 className="brand-text">REGISTRO DE USUARIO</h3>
              <div className="shape-dash" style={{ width: '25px' }}></div>
            </div>
            
            <form 
              className="minimal-form" 
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const name = data.get('username') as string;
                if (name) {
                  vm.registrarUsuario(name);
                }
              }}
            >
              <div className="form-group">
                <label>INGRESA TU NOMBRE</label>
                <input type="text" name="username" placeholder="Ej. Diego" required autoFocus />
              </div>

              <div className="modal-actions" style={{ marginTop: '25px' }}>
                <button type="submit" className="btn-solid" tabIndex={-1}>REGISTRARSE</button>
              </div>
            </form>
          </div>
        </GlobalOverlay>
      )}
    </div>
  );
}