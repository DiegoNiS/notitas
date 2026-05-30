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
    },
    // 6. Activar/Desactivar mouse con Ctrl + Alt + M
    {
      code: 'KeyM',
      ctrlKey: true,
      altKey: true,
      action: (e) => {
        e.preventDefault();
        document.body.classList.toggle('disable-mouse');
        const isMouseDisabled = document.body.classList.contains('disable-mouse');
        const event = new CustomEvent('toggle-mouse-mode', { detail: { disabled: isMouseDisabled } });
        window.dispatchEvent(event);
      },
      description: 'Activar/Desactivar interacción con mouse'
    },
    // 7. Mostrar ayuda con F1
    {
      code: 'F1',
      action: (e) => {
        e.preventDefault();
        const event = new CustomEvent('open-shortcut-help');
        window.dispatchEvent(event);
      },
      description: 'Mostrar ayuda de atajos de teclado'
    }
  ]);
};

export const unregisterGlobalShortcuts = () => {
  ShortcutManager.unregisterGroup('global_navigation');
};
