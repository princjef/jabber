import * as readline from 'readline';
import * as Prompt from 'inquirer/lib/prompts/base';
import * as stringWidth from 'string-width';
import * as cliWidth from 'cli-width';
import * as _ from 'lodash';

import CommandHistory from './history';
import Input from './input';
import Completion from './completion';

export interface PromptOptions {
    name: string;
    message: string;
    commandHistory: CommandHistory;
    completionFn?: (args: string[]) => Promise<string[]> | string[];
    hasInterrupted: false;
}

export default class CommandPrompt extends Prompt {

    static interrupted = Symbol();
    static interruptedWithNoInput = Symbol();

    public rl: readline.ReadLine;
    public screen: any;

    private _buffer: string = '';
    private _done: (value: any) => void;
    private _completion: Completion | null = null;
    private _input: Input;
    private _cursorMove: { dx: number; dy: number; } | null = null;
    private _hasKeypress: boolean = false;

    private get _displayBuffer(): string {
        const bufferWithHistory = this.options.commandHistory.entry !== null
            ? this.options.commandHistory.entry
            : this._buffer;
        if (this._completion) {
            return this._completion.renderCommand(bufferWithHistory);
        } else {
            return bufferWithHistory;
        }
    }

    private get _args(): string[] {
        return this._buffer.split(/\s+/g);
    }

    constructor(public options: PromptOptions, rl: readline.ReadLine, answers: any) {
        super(options, rl, answers);

        this._input = Input.register(rl);

        this._input.on('interrupt', () => {
            // Interrupts clear out completions, but persist history
            if (this.options.commandHistory.entry !== null) {
                this._buffer = this.options.commandHistory.entry;
            }
            this._completion = null;
            this.render();

            if (this._hasKeypress) {
                this._done(CommandPrompt.interrupted);
            } else {
                this._done(CommandPrompt.interruptedWithNoInput);
            }
        });

        this._input.on('up', () => {
            this._hasKeypress = true;
            // Clear out completions
            this._completion = null;
            this.options.commandHistory.previousMatch(this._buffer);
            this._rewriteOutput();
            this.render();
        });

        this._input.on('down', () => {
            this._hasKeypress = true;
            // Clear out completions
            this._completion = null;
            this.options.commandHistory.nextMatch(this._buffer);
            this._rewriteOutput();
            this.render();
        });

        this._input.on('tab', async (shift: boolean) => {
            this._hasKeypress = true;
            // Lock history selection
            if (this.options.commandHistory.entry !== null) {
                this._buffer = this.options.commandHistory.entry;
            }
            this.options.commandHistory.inputEdited();

            if (!this._completion && typeof this.options.completionFn === 'function') {
                this._completion = Completion.populate(this._args, await this.options.completionFn(this._args));
                if (this._completion.possibleCompletionCount === 0) {
                    // If there are no possible completions, we can't do anything
                    // with the completions. Act as if it doesn't exist
                    this._completion = null;
                } else if (this._completion.possibleCompletionCount === 1) {
                    // If there is one possible completion, just select it and
                    // then clear out the completions
                    this._buffer = this._completion.renderCommand(this._buffer) + ' ';
                    this._completion = null;
                }
            } else if (this._completion) {
                if (shift) {
                    this._completion.selectPrevious();
                } else {
                    this._completion.selectNext();
                }
            }

            this._rewriteOutput();
            this.render();
        });

        this._input.on('enter', () => {
            this._hasKeypress = true;
            if (this.options.commandHistory.entry !== null) {
                this._buffer = this.options.commandHistory.entry;
            }
            if (this._completion && this._completion.selection !== null) {
                this._buffer = this._completion.renderCommand(this._buffer) + ' ';
                this._completion = null;
                this.render();
            }

            this._completion = null;
            this.render();
            this.screen.done();
            this._done(this._buffer);
        });

        this._input.on('input', (data: string) => {
            this._hasKeypress = true;
            // Lock the history entry and clear out completions
            this._completion = null;
            if (this.options.commandHistory.entry !== null) {
                this._buffer = this.options.commandHistory.entry;
            }
            this.options.commandHistory.inputEdited();
            this._buffer = (this.rl as any).line;
            this.render();
        });
    }

    run(): Promise<any> {
        return new Promise((resolve, reject) => {
            this._run(resolve);
            const cleanup = (cb: Function): Function => {
                return (...args: any[]) => {
                    this._input.deregister();
                    cb(...args);
                };
            };
            super.run().then(cleanup(resolve)).catch(cleanup(reject));
        });
    }

    getQuestion(): string {
        return this.options.message;
    }

    render(error?: string): void {
        // We first need to fix the cursor if it has been moved or our terminal
        // gets really messed up...
        if (this._cursorMove !== null) {
            readline.moveCursor(process.stdout, -this._cursorMove.dx, -this._cursorMove.dy);
            this._cursorMove = null;
        }

        let message = this.getQuestion() + this._displayBuffer;
        if (this._completion && this._completion.possibleCompletionCount > 0) {
            const separator = '  ';

            const options = this._completion.renderOptions();
            const optionsPerLine = Math.floor(
                (this._cliWidth() + stringWidth(separator)) / (stringWidth(options[0]) + stringWidth(separator))
            );

            const optionsLines = _.chunk(options, optionsPerLine)
                .map(line => line.join(separator));

            this._cursorMove = {
                dx: stringWidth(message) - stringWidth(optionsLines[optionsLines.length - 1]),
                dy: -1 * optionsLines.length
            };
            message += `\n${optionsLines.join('\n')}`;
        }
        this.screen.render(message);
        if (this._cursorMove !== null) {
            readline.moveCursor(process.stdout, this._cursorMove.dx, this._cursorMove.dy);
        }
    }

    private _run(cb: (value: any) => void): this {
        this._done = cb;
        this.render();
        return this;
    }

    private _rewriteOutput() {
        // Simulate Ctrl+u to delete the line written previously
        this.rl.write(null!, { ctrl: true, name: 'u' });
        // Write the value of the buffer so that edits to it will work correctly
        this.rl.write(this._displayBuffer);
    }

    private _cliWidth(): number {
        const width = cliWidth({
            defaultWidth: 80,
            output: (this.rl as any).output
        });

        return process.platform === 'win32'
            ? width - 1
            : width;
    }
}
