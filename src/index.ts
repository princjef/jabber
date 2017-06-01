import Shell from './shell';
import { CommandProcessor } from './types';

export * from './types';

export function create(processor: CommandProcessor) {
    return Shell.create(processor);
}
