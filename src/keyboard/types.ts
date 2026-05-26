export interface ShortcutConfig {
    code?: string;         
    codeMatcher?: (code: string) => boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    action: (e: KeyboardEvent) => void;     
    preventDefault?: boolean;
    description?: string; // Para documentación o ayuda en UI
}