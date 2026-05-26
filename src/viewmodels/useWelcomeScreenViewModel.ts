// src/viewmodels/useWelcomeScreenViewModel.ts
import { useState, useEffect } from 'react';
import { ShortcutManager } from '../keyboard/ShortcutManager';
import { AppRoute } from '../navigation/types';
import { db } from '../services/database';

export function useWelcomeScreenViewModel(
    navigateTo: (route: AppRoute) => void
) {
    const [nombreUsuario, setNombreUsuario] = useState<string>('...');

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
            },
            // Ir al Menú Principal (Sidebar) con Ctrl + B
            // Este atajo ya está registrado globalmente en App.tsx, así que no es necesario duplicarlo aquí.
            // Si quisieras un atajo específico para esta vista, lo registrarías aquí.
        ]);

        return () => {
            ShortcutManager.unregisterGroup('welcomeScreen');
        };
    }, [navigateTo]); // Dependencia de navigateTo

    return {
        nombreUsuario,
        // Podríamos exponer aquí métodos si hubiera acciones específicas desde la vista,
        // como un handleStartClick() que llame a navigateTo({ type: 'dashboard' })
    };
}
