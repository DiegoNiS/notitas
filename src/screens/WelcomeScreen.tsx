// Ruta: src/screens/WelcomeScreen.tsx
import { useWelcomeScreenViewModel } from '../viewmodels/useWelcomeScreenViewModel';
import { AppRoute } from '../navigation/types';
import { CursoDetalle } from '../services/database';
import { CursosSwitcher } from '../components/composite/CursosSwitcher';

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
        BIENVENIDO, {vm.nombreUsuario.toUpperCase()}.
      </h1>
      
      <p className="welcome-subtitle">
        Presiona <kbd>↓</kbd> para iniciar o <kbd>Ctrl + Tab</kbd> para buscar curso.
      </p>

      <div className="navigation-hint bottom-hint">
        <div className="shape-triangle down"></div>
      </div>
    </div>
  );
}