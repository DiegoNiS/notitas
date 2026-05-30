import { ShortcutConfig } from './types';

export class ShortcutManager {
    private static groups: Map<string, ShortcutConfig[]> = new Map();
    private static globalListener: ((e: KeyboardEvent) => void) | null = null;

    public static getActiveShortcuts() {
        return this.groups;
    }

    public static registerGroup(groupId: string, configs: ShortcutConfig[]) {
        this.groups.set(groupId, configs);
        this.initGlobalListener();
    }

    public static unregisterGroup(groupId: string) {
        this.groups.delete(groupId);
        if (this.groups.size === 0 && this.globalListener) {
            document.removeEventListener('keydown', this.globalListener, {capture: true});
            this.globalListener = null;
        }
    }

    private static initGlobalListener() {
        if (this.globalListener) return;

        this.globalListener = (e: KeyboardEvent) => {
            for(const [, shortcuts] of this.groups.entries()) {
                for (const config of shortcuts) {
                    const matchCode = config.code
                        ? e.code === config.code
                        : config.codeMatcher ? config.codeMatcher(e.code) : false;
                    const matchCtrl = !!config.ctrlKey === e.ctrlKey;
                    const matchAlt = !!config.altKey === e.altKey;
                    const matchShift = !!config.shiftKey === e.shiftKey;

                    if (matchCode && matchCtrl && matchAlt && matchShift) {
                        if (config.preventDefault !== false) {
                            e.preventDefault();
                        }
                        config.action(e);
                        return;
                    }
                }
            }
        };

        // usamos capture: true para que intercepte con prioridad absoluta
        document.addEventListener('keydown', this.globalListener, {capture: true});
    }
}