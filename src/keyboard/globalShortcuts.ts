// Ruta: src/keyboard/globalShortcuts.ts
import { ShortcutManager } from './ShortcutManager';
import { AppRoute } from '../navigation/types';

interface GlobalShortcutParams {
  toggleSidebar: () => void;
  navigateTo: (route: AppRoute) => void;
  navigateBack: () => void;
  navigateForward: () => void;
}

export const registerGlobalShortcuts = (params: GlobalShortcutParams) => {
  ShortcutManager.registerGroup('global_navigation', [
    // 1. Mostrar/Ocultar Sidebar con Ctrl + B
    {
      code: 'KeyB',
      ctrlKey: true,
      action: (e) => {
        e.preventDefault();
        params.toggleSidebar();
      },
      description: 'Mostrar/Ocultar barra lateral'
    },
    // 2. Ir a Bienvenida con Alt + Flecha Arriba
    {
      code: 'ArrowUp',
      altKey: true,
      action: (e) => {
        e.preventDefault();
        params.navigateTo({ type: 'welcome' });
      },
      description: 'Navegar a Bienvenida'
    },
    // 3. Ir a Dashboard con Alt + Flecha Abajo
    {
      code: 'ArrowDown',
      altKey: true,
      action: (e) => {
        e.preventDefault();
        params.navigateTo({ type: 'dashboard' });
      },
      description: 'Navegar a Cursos'
    },
    // 4. Retroceder en el historial con Alt + Flecha Izquierda
    {
      code: 'ArrowLeft',
      altKey: true,
      action: (e) => {
        e.preventDefault();
        params.navigateBack();
      },
      description: 'Retroceder navegación'
    },
    // 5. Avanzar en el historial con Alt + Flecha Derecha
    {
      code: 'ArrowRight',
      altKey: true,
      action: (e) => {
        e.preventDefault();
        params.navigateForward();
      },
      description: 'Avanzar navegación'
    }
  ]);
};

export const unregisterGlobalShortcuts = () => {
  ShortcutManager.unregisterGroup('global_navigation');
};
