export interface CommandProcessor {
    handler: (args: string[]) => Promise<void> | void;
    onInterrupt: () => void;
    getCompletions?: (args: string[]) => Promise<string[]> | string[];
}
