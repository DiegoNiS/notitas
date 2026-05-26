import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { QuickSwitcher } from './components/QuickSwitcher'; // Añade esta línea
import { NavHost } from './navigation/NavHost';
import { useNavigationController } from './navigation/NavigationController';
import { ShortcutManager } from './keyboard/ShortcutManager';
import { db, CursoDetalle } from './services/database'; // Importamos la DB
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);  
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherIndex = 0;
  const [cursos, setCursos] = useState<CursoDetalle[]>([]);

  //Inicializamos nuestro NavHost Controller nativo
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
    ShortcutManager.registerGroup('global_navigation',[
      {
        code: 'keyB', ctrlKey: true,
        action: () => setIsSidebarOpen(prev => !prev)
      },
      { code: 'ArrowUp', altKey: true, 
        action: () => navController.navigateTo({ type: 'welcome'})
      },
      {
        code: 'ArrowDown', altKey: true,
        action: () => navController.navigateTo({ type: 'dashboard'})
      },
      {
        code: 'ArrowRight', altKey: true,
        action: () => navController.navigateBack()
      },
      {
        code: 'ArrowLeft', altKey: true, 
        action: () => navController.navigateForward()
      }
    ]);

    return () => ShortcutManager.unregisterGroup('global_navigation');
  }, [navController]); 

  return (
    <div className="app-container">
      {isSidebarOpen && <div className="focus-overlay" onClick={() => setIsSidebarOpen(false)} />}

      <QuickSwitcher 
        isOpen={isSwitcherOpen} 
        onClose={() => setIsSwitcherOpen(false)} 
        selectedIndex={switcherIndex} 
        cursos={cursos} 
        onSelectCurso={(id) => navController.navigateTo({ type: 'course', courseId: id})}
      />

      <Sidebar 
        isOpen={isSidebarOpen} 
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

export default App;