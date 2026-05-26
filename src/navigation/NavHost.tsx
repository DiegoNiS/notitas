import { WelcomeScreen } from '../screens/WelcomeScreen';
import { Dashboard } from '../screens/Dashboard';
import { CourseView } from '../screens/CourseView';
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
            return <WelcomeScreen navigateTo={navigateTo} />;
        case 'dashboard':
            return (
                <Dashboard
                    cursos={cursos}
                    onRecargar={onRecargarCursos}
                    onSelectCurso={(id) => navigateTo({ type: 'course', courseId: id })}
                />
            );
        case 'course': {
            const cursoActivo = cursos.find(c => c.id === currentRoute.courseId) || null;
            return (
                <CourseView
                    curso={cursoActivo}
                    onBack={navigateBack}
                    navigateTo={navigateTo}
                />
            );
        }
        default:
            return <WelcomeScreen navigateTo={navigateTo} />;
    }
}