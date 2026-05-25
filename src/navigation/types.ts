export type AppRoute = 
    | { type: 'welcome' }
    | { type: 'dashboard' }
    | { type: 'course'; courseId: string }; 