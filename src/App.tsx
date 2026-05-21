import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Dashboard } from './components/Dashboard';
import { QuickSwitcher } from './components/QuickSwitcher'; // Añade esta línea
import { db, CursoDetalle } from './services/database'; // Importamos la DB
import { CourseView } from './components/CourseView';
import './App.css';

type View = 'welcome' | 'dashboard' | 'course';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);  
  // --- ESTADO GLOBAL DE DATOS ---
  const [cursos, setCursos] = useState<CursoDetalle[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // EL VERDADERO MOTOR DE HISTORIAL (Como un Navegador Web)
  const [history, setHistory] = useState<View[]>(['welcome']);
  const [historyIndex, setHistoryIndex] = useState(0); // Puntero de dónde estamos en el tiempo
  
  // Función para cargar/recargar datos desde la DB
  const cargarCursos = async () => {
    const data = await db.obtenerCursos();
    setCursos(data);
  };

  // La vista actual es a la que apunta nuestro índice
  const currentView = history[historyIndex];

  // Función abstracta para avanzar espacialmente y registrarlo en el historial
  const navigateTo = (nextView: View) => {
    // Si viajamos en el tiempo hacia atrás y luego navegamos, el "futuro" se borra
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, nextView]);
    setHistoryIndex(newHistory.length);
  };

  // MOTOR LATERAL (Quick Switcher)
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [switcherIndex, setSwitcherIndex] = useState(0); // <-- Nuevo estado para saber qué item seleccionar

  useEffect(() => {
    cargarCursos(); // Carga inicial
    const handleKeyDown = (e: KeyboardEvent) => {

      // --- NAVEGACIÓN EN EL HISTORIAL (Alt + <- / ->) ---
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        // Viajar al pasado (si no estamos en el inicio)
        setHistoryIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }

      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        // Viajar al futuro (solo si antes viajamos al pasado)
        setHistoryIndex((prev) => (prev < history.length - 1 ? prev + 1 : prev));
      }

      // --- NAVEGACIÓN ESPACIAL (Siguiendo los Triángulos abstractos) ---
      // Si no presionas Alt ni Ctrl, usamos las flechas puras
      if (!e.altKey && !e.ctrlKey && !e.shiftKey) {
        if (e.key === 'ArrowDown' && currentView === 'welcome') {
          e.preventDefault();
          navigateTo('dashboard'); // El triángulo ▼ nos manda aquí
        }
        
        if (e.key === 'ArrowUp' && currentView === 'dashboard') {
          e.preventDefault();
          navigateTo('welcome'); // El triángulo ▲ nos manda de regreso arriba
        }
      }

      // --- QUICK SWITCHER (Navegación Lateral: Ctrl + Tab / Shift) ---
      if (e.ctrlKey && e.code === 'Tab') {
        e.preventDefault(); 
        
        if (!isSwitcherOpen) {
          setIsSwitcherOpen(true);
          // Si recién abrimos el menú, preseleccionamos el segundo elemento (como Alt+Tab de Windows)
          setSwitcherIndex(cursos.length > 1 ? 1 : 0);
        } else {
          // Si ya está abierto, navegamos por el arreglo iterando en círculo
          if (e.shiftKey) {
            // Hacia Arriba (Ctrl + Shift + Tab)
            setSwitcherIndex((prev) => (prev > 0 ? prev - 1 : cursos.length - 1));
          } else {
            // Hacia Abajo (Ctrl + Tab)
            setSwitcherIndex((prev) => (prev < cursos.length - 1 ? prev + 1 : 0));
          }
        }
      }

      // --- ATAJOS GLOBALES ---
      if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
      
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        setIsSidebarOpen(false);
        setIsSwitcherOpen(false);
      }
    };

    // NUEVO: Escuchar cuando se SUELTA una tecla (Key Up)
    const handleKeyUp = (e: KeyboardEvent) => {
      // Si soltamos la tecla 'Control' y el Switcher estaba abierto...
      if (e.key === 'Control' && isSwitcherOpen) {
        
        setIsSwitcherOpen(false); // 1. Cerramos el Switcher visualmente

        // 2. Ejecutamos la acción: Viajar al curso seleccionado
        if (cursos.length > 0 && switcherIndex >= 0) {
          const cursoSeleccionado = cursos[switcherIndex];
          setSelectedCourseId(cursoSeleccionado.id);
          
          // Avanzamos en el historial hacia la vista de curso
          const newHistory = history.slice(0, historyIndex + 1);
          setHistory([...newHistory, 'course']);
          setHistoryIndex(newHistory.length);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSwitcherOpen, switcherIndex, cursos, history, historyIndex]); 

  // ... (El render de las vistas y componentes se mantiene igual que antes)

  const renderCurrentView = () => {
    switch (currentView) {
      case 'welcome': 
        return <WelcomeScreen />;
      
      case 'dashboard': 
        return (
          <Dashboard 
            cursos={cursos} 
            onRecargar={cargarCursos} 
            onSelectCurso={(cursoId) => {
              setSelectedCourseId(cursoId);
              // Avanzamos espacialmente hacia la vista de curso
              const newHistory = history.slice(0, historyIndex + 1);
              setHistory([...newHistory, 'course']);
              setHistoryIndex(newHistory.length);
            }} 
          />
        );
        
      case 'course': {
        const cursoActivo = cursos.find(c => c.id === selectedCourseId) || null;
        return (
          <CourseView 
            curso={cursoActivo} 
            onBack={() => {
              // Viajamos al pasado (Dashboard)
              setHistoryIndex((prev) => (prev > 0 ? prev - 1 : prev));
            }} 
          />
        );
      }
      
      default: return <WelcomeScreen />;
    }
  };

  return (
    <div className="app-container">
      {isSidebarOpen && <div className="focus-overlay" onClick={() => setIsSidebarOpen(false)} />}

      {/* EL NAVEGADOR RÁPIDO */}
      <QuickSwitcher 
        isOpen={isSwitcherOpen} 
        onClose={() => setIsSwitcherOpen(false)} 
        selectedIndex={switcherIndex} 
        cursos={cursos} 
        onSelectCurso={(cursoId) => {
          // Esta es la acción que inyectamos para los clics de ratón
          setSelectedCourseId(cursoId);
          const newHistory = history.slice(0, historyIndex + 1);
          setHistory([...newHistory, 'course']);
          setHistoryIndex(newHistory.length);
        }}
      />

      {/* Le pasamos onSelectCurso para que el Sidebar pueda forzar el viaje */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        cursos={cursos} 
        onSelectCurso={(cursoId) => {
          setSelectedCourseId(cursoId);
          setIsSidebarOpen(false); // <--- AÑADIDO: Cierra el menú al seleccionar
          
          const newHistory = history.slice(0, historyIndex + 1);
          setHistory([...newHistory, 'course']);
          setHistoryIndex(newHistory.length);
        }}
      />

      <main className="editor-container">
        {!isSidebarOpen && (
          <button className="abstract-toggle" onClick={() => setIsSidebarOpen(true)}>
            <div className="shape-dash"></div>
          </button>
        )}
        
        <div className="editor-content">
          <div key={currentView} className="view-wrapper">
            {renderCurrentView()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;