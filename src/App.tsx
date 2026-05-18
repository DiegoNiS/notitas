import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Efecto maestro para el teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Alternar con Ctrl + B (pasamos a minúscula por si tienes Caps Lock encendido)
      if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        setIsSidebarOpen((prev) => !prev);
      }
      
      // 2. Salir del foco con Escape (Atrapamos tanto el nombre 'Escape' como su código numérico 27)
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        setIsSidebarOpen(false);
      }
    };

    // Cambiamos 'window' por 'document' para que escuche sin importar dónde esté el foco
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-container">
      
      {/* LA CAPA DE FOCO (Overlay): Solo existe si el panel está abierto. 
          Al hacer clic en ella, pierde el foco y cierra el panel. */}
      {isSidebarOpen && (
        <div 
          className="focus-overlay" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* PANEL LATERAL */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-content">
          {/* Un indicador visual geométrico dentro del panel */}
          <div className="shape-square"></div>
          <p>Presiona <code>Esc</code> para salir del foco.</p>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="editor-container">
        
        {/* BOTÓN GEOMÉTRICO ABSTRACTO (El guion grueso) */}
        {!isSidebarOpen && (
          <button 
            className="abstract-toggle" 
            onClick={() => setIsSidebarOpen(true)}
          >
            <div className="shape-dash"></div>
          </button>
        )}
        
        <div className="editor-content">
          <h1>Editor</h1>
          <p>La interfaz se ha desvanecido.</p>
        </div>
      </main>

    </div>
  );
}

export default App;