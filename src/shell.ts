import * as inquirer from 'inquirer';

import CommandHistory from './history';
import CommandPrompt from './commandPrompt';
import Input from './input';
import { CommandProcessor } from './types';

export default class Shell {
    private _history: CommandHistory;

    private _processor: CommandProcessor;

    private _delimiter: string = '> ';

    private _interrupted: boolean = false;

    private _input: Input | null = null;

    private constructor(processor: CommandProcessor) {
        this._history = CommandHistory.create();
        this._processor = processor;
    }

    static create(processor: CommandProcessor): Shell {
        return new Shell(processor);
    }

    /**
     * Sets the delimiter at the beginning of the input prompt to the desired
     * value. Currently only updates the delimiter starting with the next
     * command.
     *
     * @param delimiter The delimiter to use at the beginning of the prompt
     */
    delimiter(delimiter: string): this {
        this._delimiter = delimiter;
        return this;
    }

    /**
     * Starts the command line interface
     */
    async run() {
        const promptModule = inquirer.createPromptModule();
        promptModule.registerPrompt('command', CommandPrompt as any);
        while (true) {
            await this.prompt(promptModule).catch(() => { /* noop */ });
        }
    }

    private async prompt(promptModule: inquirer.PromptModule) {
        try {
            if (this._interrupted) {
                console.log('Press Ctrl-C again to exit');
            }

            // Relinquish control to inquirer
            if (this._input !== null) {
                this._input.deregister();
                this._input = null;
            }

            const { command } = await (promptModule as any)([{
                type: 'command',
                name: 'command',
                message: this._delimiter,
                commandHistory: this._history,
                completionFn: this._processor.getCompletions
            }]);

            this._input = Input.register();

            this._input.on('interrupt', () => {
                this._processor.onInterrupt();
            });

            this._history.resetSearch();

            if (command === CommandPrompt.interruptedWithNoInput) {
                if (this._interrupted) {
                    process.exit();
                } else {
                    this._interrupted = true;
                    return;
                }
            } else if (command === CommandPrompt.interrupted) {
                this._interrupted = false;
                return;
            }

            this._interrupted = false;

            if (command.trim()) {
                this._history.addEntry(command.trim());
            } else {
                // Pass if the command is empty
                return;
            }

            // TODO: listen for interrupts during command
            await this._processor.handler(command.trim().split(/\s+/g));
        } finally { /* noop */ }
    }
}
