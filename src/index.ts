import Shell from './shell';
import { CommandProcessor } from './types';

export * from './types';

/**
 * Create a shell that runs as specified by the provided command processor
 *
 * @param processor Object specifying how you want your shell to behave,
 *                  including how it handles commands, interrupts and command
 *                  completions.
 */
export function create(processor: CommandProcessor) {
    return Shell.create(processor);
}
