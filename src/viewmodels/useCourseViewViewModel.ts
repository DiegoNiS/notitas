// src/viewmodels/useCourseViewViewModel.ts
import { useEffect } from 'react';
import { ShortcutManager } from '../keyboard/ShortcutManager';
import { AppRoute } from '../navigation/types';

// ViewModel hook for the CourseView screen
export function useCourseViewViewModel(
    cursoId: string | null, // Pass the course ID to fetch details if needed
    onBack: () => void,
    navigateTo: (route: AppRoute) => void // For potential navigation actions
) {
    // In a more complex scenario, this ViewModel would fetch course details
    // and manage state related to notes within the course.
    // For now, we'll focus on integrating keyboard shortcuts.

    useEffect(() => {
        // Register shortcut for going back
        ShortcutManager.registerGroup('courseView', [
            // Escape or Alt + ArrowLeft to go back
            { code: 'Escape', action: () => onBack() },
            { code: 'ArrowLeft', altKey: true, action: (e) => { e.preventDefault(); onBack(); } },
            // Placeholder for navigating to add a new note (e.g., Ctrl+N)
            // {
            //     code: 'KeyN',
            //     ctrlKey: true,
            //     action: () => console.log('Navigate to Add Note screen') // navigateTo({ type: 'addNote', courseId: cursoId })
            // }
        ]);

        return () => {
            ShortcutManager.unregisterGroup('courseView');
        };
    }, [onBack, cursoId, navigateTo]); // Ensure dependencies are correct

    // Expose any state or functions needed by the view
    // For now, the view primarily needs the course data (passed as prop)
    // and the navigation functions (also passed as props).
    // The ViewModel's main job here is shortcut management.

    // We can return methods to handle actions if the view needs to trigger them,
    // e.g., a method to create a new note.
    const handleCreateNote = () => {
        console.log('Create note action triggered from ViewModel');
        // navigateTo({ type: 'addNote', courseId });
    };

    return {
        handleCreateNote,
        // Add any other functions or state needed by the CourseView component
    };
}
