export default class CommandHistory {

    /**
     * The list of commands to search
     */
    private _commands: string[];

    /**
     * The indices in the history that have been eliminated because the user
     * started changing the prompt while they were selected. This seems weird
     * but it was the behavior observed when using zsh
     */
    private _excludedIndices: Set<number>;

    /**
     * The currently matched index within the command list, or null if there is
     * no such match
     */
    private _searchIndex: number | null;

    /**
     * The currently selected history entry (or null if there is none)
     */
    get entry(): string | null {
        return this._searchIndex !== null && !this._excludedIndices.has(this._searchIndex)
            ? this._commands[this._searchIndex]
            : null;
    }

    private constructor() {
        this._commands = [];
        this._excludedIndices = new Set();
        this._searchIndex = null;
    }

    public static create(existingHistory: string[] = []): CommandHistory {
        return new CommandHistory();
    }

    /**
     * Adds an entry to the history
     *
     * @param command The string value of the command to add
     */
    addEntry(command: string) {
        this._commands.push(command);
    }

    /**
     * Resets the search parameters. This should be called each time a command
     * is executed or command input is cancelled
     */
    resetSearch() {
        this._excludedIndices = new Set();
        this._searchIndex = null;
    }

    /**
     * Signals that the currently selected entry has been edited by the user.
     * This does not change the position of the search, but anchors it to the
     * previously-selected entry
     */
    inputEdited() {
        if (this._searchIndex !== null) {
            this._excludedIndices.add(this._searchIndex);
        }
    }

    /**
     * Retrieves the nearest history entry before the current selection that
     * matches the provided command text
     *
     * @param input The string value of the command typed by the user
     * @returns The matched command, or null if none was found
     */
    previousMatch(input: string): string | null {
        const startIndex = this._searchIndex === null
            ? this._commands.length - 1
            : this._searchIndex - 1;

        // If we're already past the beginning, we won't match anything
        if (startIndex < 0) {
            return null;
        }

        // We grab the commands with their indices so that we can manipulate the
        // array and still know where we are within the original array
        const indexedCommands = Array.from(this._commands.slice(0, startIndex + 1).entries()).reverse();
        return this._findMatch(input, indexedCommands);
    }

    /**
     * Retrieves the nearest history entry after the current selection that
     * matches the provided command text
     *
     * @param input The string value of the command typed by the user
     * @returns The matches command, or null if none was found
     */
    nextMatch(input: string): string | null {
        // If we haven't started a search or are already at the end of the
        // command list, there is no history below to search
        if (this._searchIndex === null || this._searchIndex >= this._commands.length - 1) {
            this._searchIndex = null;
            return null;
        }

        // We grab the commands with their indices so that we can manipulate the
        // array and still know where we are within the original array
        const indexedCommands = Array.from(this._commands.entries()).slice(this._searchIndex + 1);
        const match = this._findMatch(input, indexedCommands);

        // If no match was found, reset the search index (back to the originally
        // typed command)
        if (match === null) {
            this._searchIndex = null;
        }
        return match;
    }

    /**
     * Searches the provided list for the given input, updating the search
     * parameters and returning the found value, if applicable.
     *
     * @param input The string value of the command for which we should search
     * @param entries The list of command/index pairs that we should search, in order
     */
    private _findMatch(input: string, entries: [number, string][]): string | null {
        for (const [index, command] of entries) {
            // Skip any excluded entries
            if (this._excludedIndices.has(index)) {
                continue;
            }

            // This command has to start with the input to match
            if (command.startsWith(input)) {
                this._searchIndex = index;
                return command;
            }
        }

        return null;
    }
}
