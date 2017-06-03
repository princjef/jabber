import * as chalk from 'chalk';

export default class Completion {
    private _selectionIndex: number | null = null;
    private _options: string[];

    get selection(): string | null {
        return this._selectionIndex === null
            ? null
            : this._options[this._selectionIndex];
    }

    get possibleCompletionCount(): number {
        return this._options.length;
    }

    private constructor(options: string[]) {
        this._options = options;

        // Select the first option if it's the only one (because we're just
        // going to autofill it)
        if (options.length === 1) {
            this._selectionIndex = 0;
        }
    }

    static populate(args: string[], options: string[]): Completion {
        const lastArg = args.pop() || '';
        const filteredOptions = options.filter(option => option.startsWith(lastArg));
        return filteredOptions.length === 0
            ? new Completion(options)
            : new Completion(filteredOptions);
    }

    selectNext() {
        this._selectionIndex = this._selectionIndex === null || this._selectionIndex >= this._options.length - 1
            ? 0
            : this._selectionIndex + 1;
    }

    selectPrevious() {
        this._selectionIndex = this._selectionIndex === null || this._selectionIndex === 0
            ? this._options.length - 1
            : this._selectionIndex - 1;
    }

    renderCommand(command: string): string {
        if (this.selection !== null) {
            const lastArg = command.split(/\s+/g).pop() || '';

            if (lastArg.trim() === '') {
                // If the last argument is just whitespace, add the selection to
                // the end of the command
                return command + this.selection;
            } else if (this.selection.startsWith(lastArg)) {
                // If we're in the middle of typing the selection, replace the
                // existing arg with our selection
                return command.substring(0, command.length - lastArg.length) + this.selection;
            } else {
                // This must be a new argument. Add it to the end, after a space
                return command + ' ' + this.selection;
            }
        }

        return command;
    }

    renderOptions(): string[] {
        const longestOption = this._options.reduce((acc, val) => Math.max(acc, val.length), 0);
        return this._options
            // Right pad the entries so they are all the same length
            .map(option => `${option}${' '.repeat(longestOption - option.length)}`)
            // Invert the selected option, if applicable
            .map((option, index) => index === this._selectionIndex ? chalk.inverse(option) : option);
    }
}
