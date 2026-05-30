import { WelcomeScreen } from '../screens/WelcomeScreen';
import { Dashboard } from '../screens/Dashboard';
import { CourseView } from '../screens/CourseView';
import { EnvironmentView } from '../screens/EnvironmentView';
import { NoteEditorView } from '../screens/NoteEditorView';
import { AppRoute } from '../navigation/types';
import { CursoDetalle } from '../services/database';

interface NavHostProps {
    currentRoute: AppRoute;
    cursos: CursoDetalle[];
    onRecargarCursos: () => void;
    navigateTo: (route: AppRoute) => void;
    navigateBack: () => void;
}

export function NavHost({ currentRoute, cursos, onRecargarCursos, navigateTo, navigateBack }: NavHostProps) {
    switch (currentRoute.type) {
        case 'welcome':
            return <WelcomeScreen navigateTo={navigateTo} cursos={cursos} />;
        case 'dashboard':
            return (
                <Dashboard
                    cursos={cursos}
                    onRecargar={onRecargarCursos}
                    onSelectCurso={(id) => navigateTo({ type: 'course', courseId: id })}
                    navigateTo={navigateTo}
                />
            );
        case 'course': {
            const cursoActivo = cursos.find(c => c.id === currentRoute.courseId) || null;
            return (
                <CourseView
                    curso={cursoActivo}
                    onBack={navigateBack}
                    onSelectAmbiente={(ambienteId) => navigateTo({ type: 'environment', courseId: currentRoute.courseId, ambienteId })}
                    onSelectNota={(notaId, ambienteId) => navigateTo({ type: 'editor', courseId: currentRoute.courseId, ambienteId, notaId })}
                />
            );
        }
        case 'environment': {
            const cursoActivo = cursos.find(c => c.id === currentRoute.courseId) || null;
            return (
                <EnvironmentView
                    curso={cursoActivo}
                    ambienteId={currentRoute.ambienteId}
                    onBack={navigateBack}
                    navigateTo={navigateTo}
                />
            );
        }
        case 'editor': {
            const cursoActivo = cursos.find(c => c.id === currentRoute.courseId) || null;
            return (
                <NoteEditorView
                    curso={cursoActivo}
                    notaId={currentRoute.notaId}
                    onBack={() => navigateTo({ type: 'environment', courseId: currentRoute.courseId, ambienteId: currentRoute.ambienteId })}
                    navigateTo={navigateTo}
                />
            );
        }

        default:
            return <WelcomeScreen navigateTo={navigateTo} cursos={cursos} />;
    }
}