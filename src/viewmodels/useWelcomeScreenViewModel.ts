// src/viewmodels/useWelcomeScreenViewModel.ts
import { useState, useEffect } from 'react';
import { ShortcutManager } from '../keyboard/ShortcutManager';
import { AppRoute } from '../navigation/types';
import { db, CursoDetalle } from '../services/database';
import { useCtrlTabSwitcher } from '../keyboard/useCtrlTabSwitcher';

export function useWelcomeScreenViewModel(
    cursos: CursoDetalle[],
    navigateTo: (route: AppRoute) => void
) {
    const [nombreUsuario, setNombreUsuario] = useState<string>('...');

    // Instanciar el switcher para navegar directo a cursos
    const switcher = useCtrlTabSwitcher({
        items: cursos,
        onSelect: (curso) => navigateTo({ type: 'course', courseId: curso.id })
    });

    // Cargar datos iniciales
    useEffect(() => {
        db.obtenerUsuario().then(data => setNombreUsuario(data.nombre));
    }, []);

    // Registrar atajos específicos para WelcomeScreen
    useEffect(() => {
        ShortcutManager.registerGroup('welcomeScreen', [
            // Navegar al Dashboard con ↓
            {
                code: 'ArrowDown',
                action: (e) => {
                    e.preventDefault();
                    console.log('WelcomeScreen: Navigating to Dashboard');
                    navigateTo({ type: 'dashboard' });
                },
                description: 'Navigate to Dashboard'
            }
        ]);

        return () => {
            ShortcutManager.unregisterGroup('welcomeScreen');
        };
    }, [navigateTo]); // Dependencia de navigateTo

    return {
        nombreUsuario,
        switcher
    };
}
