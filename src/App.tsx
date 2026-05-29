// Ruta: src/App.tsx
import { useState, useEffect } from 'react';
import { Sidebar } from './components/composite/Sidebar';
import { NavHost } from './navigation/NavHost';
import { useNavigationController } from './navigation/NavigationController';
import { db, CursoDetalle } from './services/database';
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from './keyboard/globalShortcuts';
import { OverlayProvider } from './context/OverlayContext';
import './App.css';

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);  
  const [cursos, setCursos] = useState<CursoDetalle[]>([]);

  // Inicializamos nuestro NavHost Controller nativo
  const navController = useNavigationController({ type: 'welcome' });

  // Función para cargar/recargar datos desde la DB
  const cargarCursos = async () => {
    const data = await db.obtenerCursos();
    setCursos(data);
  };

  useEffect(() => {
    cargarCursos(); // Carga inicial
  }, []);

  // -- REGISTRO DE ATAJOS GLOBALES DE LA APP --
  useEffect(() => {
    registerGlobalShortcuts({
      toggleSidebar: () => setIsSidebarOpen(prev => !prev),
      navigateTo: navController.navigateTo,
      navigateBack: navController.navigateBack,
      navigateForward: navController.navigateForward
    });

    return () => unregisterGlobalShortcuts();
  }, [navController]); 

  return (
    <div className="app-container">
      {/* Sidebar controla autónomamente su overlay */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        cursos={cursos} 
        onSelectCurso={(id) => navController.navigateTo({ type: 'course', courseId: id})}
      />

      <main className="editor-container">
        {/* El NavHost se encarga por completo de la pantalla activa */}
        <NavHost 
          currentRoute={navController.currentRoute}
          cursos={cursos}
          onRecargarCursos={cargarCursos}
          navigateTo={navController.navigateTo}
          navigateBack={navController.navigateBack}
        />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <OverlayProvider>
      <AppContent />
    </OverlayProvider>
  );
}