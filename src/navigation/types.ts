export type AppRoute = 
    | { type: 'welcome' }
    | { type: 'dashboard' }
    | { type: 'course'; courseId: string }
    | { type: 'environment'; courseId: string; ambienteId: string }
    | { type: 'editor'; courseId: string; ambienteId: string; notaId: string };