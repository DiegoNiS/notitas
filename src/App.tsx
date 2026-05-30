// Ruta: src/App.tsx
import { useState, useEffect } from 'react';
import { Sidebar } from './components/composite/Sidebar';
import { NavHost } from './navigation/NavHost';
import { useNavigationController } from './navigation/NavigationController';
import { db, CursoDetalle } from './services/database';
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from './keyboard/globalShortcuts';
import { OverlayProvider } from './context/OverlayContext';
import { ShortcutHelpModal } from './components/composite/ShortcutHelpModal';
import './App.css';

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);  
  const [cursos, setCursos] = useState<CursoDetalle[]>([]);
  const [mouseToast, setMouseToast] = useState<{ id: string; title: string; description: string } | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Inicializamos nuestro NavHost Controller nativo
  const navController = useNavigationController({ type: 'welcome' });

  // Función para cargar/recargar datos desde la DB
  const cargarCursos = async () => {
    const data = await db.obtenerCursos();
    setCursos(data);
  };

  useEffect(() => {
    cargarCursos(); // Carga inicial
    // Modo teclado activo por defecto al iniciar
    document.body.classList.add('disable-mouse');
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

  // Escuchar el evento de activación/desactivación de mouse
  useEffect(() => {
    const handleToggleMouse = (e: Event) => {
      const customEvent = e as CustomEvent<{ disabled: boolean }>;
      const disabled = customEvent.detail.disabled;
      
      const toastId = Math.random().toString(36).substring(2, 9);
      setMouseToast({
        id: toastId,
        title: disabled ? "MODO TECLADO" : "MODO HÍBRIDO",
        description: disabled ? "RATÓN DESACTIVADO COMPLETAMENTE" : "RATÓN ACTIVADO NUEVAMENTE"
      });
      
      setTimeout(() => {
        setMouseToast(prev => prev?.id === toastId ? null : prev);
      }, 4000);
    };

    window.addEventListener('toggle-mouse-mode', handleToggleMouse);
    return () => window.removeEventListener('toggle-mouse-mode', handleToggleMouse);
  }, []); 

  // Escuchar el evento de ayuda de atajos
  useEffect(() => {
    const handleOpenHelp = () => {
      setIsHelpOpen(true);
    };
    window.addEventListener('open-shortcut-help', handleOpenHelp);
    return () => window.removeEventListener('open-shortcut-help', handleOpenHelp);
  }, []);

  return (
    <div className="app-container">
      {/* Draggable header region for borderless window */}
      <div className="app-drag-bar" data-tauri-drag-region />

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

      {/* Global Mouse Toggle Toast */}
      {mouseToast && (
        <div className="global-toast-container">
          <div className="toast-item">
            <div className="toast-icon-circle"></div>
            <div className="toast-content" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="brand-text" style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ffffff', letterSpacing: '1px' }}>
                {mouseToast.title}
              </span>
              <span style={{ fontSize: '0.65rem', opacity: 0.5, textTransform: 'none', color: 'var(--text-color)' }}>
                {mouseToast.description}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Atajos de teclado modal global */}
      <ShortcutHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
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