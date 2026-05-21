// Ruta: src/components/WelcomeScreen.tsx
import { useEffect, useState } from 'react';
import { db } from '../services/database';

export function WelcomeScreen() {
  const [nombreUsuario, setNombreUsuario] = useState('...');

  useEffect(() => {
    // Al cargar la pantalla, consultamos la DB
    db.obtenerUsuario().then(data => setNombreUsuario(data.nombre));
  }, []);

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