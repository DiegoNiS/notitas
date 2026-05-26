// Ruta: src/screens/CourseView.tsx
import { useCourseViewViewModel } from '../viewmodels/useCourseViewViewModel';
import { CursoDetalle } from '../services/database';
import { AppRoute } from '../navigation/types';

interface CourseViewProps {
  curso: CursoDetalle | null;
  onBack: () => void; // Function to go back to Dashboard
  navigateTo: (route: AppRoute) => void; // Function to navigate to other routes
}

export function CourseView({ curso, onBack, navigateTo }: CourseViewProps) {
  
  // Usamos el ViewModel para registrar los atajos de teclado y lógica correspondientes
  useCourseViewViewModel(curso?.id || null, onBack, navigateTo);

  if (!curso) return <div className="view-container">Cargando curso...</div>;

  return (
    <div className="view-container slide-left-enter course-view-container">
      
      {/* Indicador espacial: El Dashboard está hacia la izquierda */}
      <div className="navigation-hint left-hint" onClick={onBack} style={{ cursor: 'pointer' }}>
        <div className="shape-triangle left"></div>
      </div>
      
      <div className="course-header-large">
        <h1 className="course-title-abbr brand-text">{curso.abreviatura}</h1>
        <div className="shape-dash vertical-dash"></div>
        <div className="course-title-full">
          <h2>{curso.nombre}</h2>
          <p className="course-meta-info">Presiona <kbd>Esc</kbd> o <kbd>Alt</kbd> + <kbd>←</kbd> para volver</p>
        </div>
      </div>

      <div className="shape-dash" style={{ width: '100%', opacity: 0.1, marginBottom: '30px' }}></div>

      {/* LOS AMBIENTES (Columnas de trabajo) */}
      <div className="ambientes-layout">
        {curso.ambientes.map((ambienteNombre, index) => (
          <div key={index} className="ambiente-column">
            
            <div className="ambiente-header">
              <h3 className="brand-text">{ambienteNombre.toUpperCase()}</h3>
              <div className="shape-circle" style={{ width: '8px', height: '8px', opacity: 0.3 }}></div>
            </div>
            
            <div className="ambiente-content">
              <p style={{ fontSize: '0.75rem', opacity: 0.4, fontStyle: 'italic' }}>
                No hay notas en {ambienteNombre} aún. Presiona <kbd>Ctrl + N</kbd> para crear una.
              </p>
              {/* Aquí luego irán las Cards de las notas individuales */}
            </div>

          </div>
        ))}
        
        {curso.ambientes.length === 0 && (
          <p style={{ opacity: 0.5 }}>Este curso no tiene ambientes asignados.</p>
        )}
      </div>

    </div>
  );
}