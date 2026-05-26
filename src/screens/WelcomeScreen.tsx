// Ruta: src/screens/WelcomeScreen.tsx
import { useWelcomeScreenViewModel } from '../viewmodels/useWelcomeScreenViewModel';
import { AppRoute } from '../navigation/types';

interface WelcomeScreenProps {
  navigateTo: (route: AppRoute) => void;
}

export function WelcomeScreen({ navigateTo }: WelcomeScreenProps) {
  const { nombreUsuario } = useWelcomeScreenViewModel(navigateTo);


  return (
    <div className="view-container fade-enter welcome-container">
      <div className="shape-square welcome-icon"></div>
      
      <h1 className="brand-text welcome-title">
        BIENVENIDO, {nombreUsuario.toUpperCase()}.
      </h1>
      
      <p className="welcome-subtitle">
        Presiona <kbd>↓</kbd> para iniciar o <kbd>Ctrl + B</kbd> para el menú.
      </p>

      <div className="navigation-hint bottom-hint">
        <div className="shape-triangle down"></div>
      </div>
    </div>
  );
}