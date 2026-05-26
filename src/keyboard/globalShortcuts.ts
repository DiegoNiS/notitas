// src/keyboard/globalShortcuts.ts

import { ShortcutManager } from './ShortcutManager';
import { useNavigationController } from '../navigation/NavigationController';

export const registerGlobalShortcuts = () => {
    // Example: Registering Ctrl + ArrowLeft and Ctrl + ArrowRight for navigation
    // IMPORTANT: You'll need to provide the actual navigateBack and navigateForward functions
    // from your NavigationController here.
    ShortcutManager.registerGroup('global', [
        {
            code: 'ArrowLeft',
            ctrlKey: true,
            action: (e) => {
                e.preventDefault();
                useNavigationController().navigateBack();
            },
            description: 'Navigate back'
        },
        {
            code: 'ArrowRight',
            ctrlKey: true,
            action: (e) => {
                e.preventDefault();
                useNavigationController().navigateForward();
            },
            description: 'Navigate forward'
        },
        // Add other global shortcuts here
    ]);
};

export const unregisterGlobalShortcuts = () => {
    ShortcutManager.unregisterGroup('global');
};
