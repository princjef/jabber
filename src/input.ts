import * as readline from 'readline';
import { EventEmitter } from 'events';
import * as tty from 'tty';

export default class Input extends EventEmitter {

    private _interface: readline.ReadLine;

    private _keypressListener: Function;

    private _hasExternalInterface: boolean;

    private constructor(rl?: readline.ReadLine) {
        super();

        this._hasExternalInterface = !!rl;

        this._interface = rl || readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        (readline as any).emitKeypressEvents(process.stdin, this._interface);

        // If stdin is a TTY, it has to be in raw mode
        if (process.stdin.isTTY) {
            (process.stdin as tty.ReadStream).setRawMode(true);
        }

        this._keypressListener = (data: string, key: readline.Key) => {
            if (key.ctrl && !key.shift && !key.meta && ['c', 'C'].indexOf(key.name || '') > -1) {
                this.emit('interrupt');
            } else if (key.name === 'up') {
                this.emit('up');
            } else if (key.name === 'down') {
                this.emit('down');
            } else if (key.name === 'tab') {
                this.emit('tab', key.shift || false);
            } else if (key.name === 'return' || key.name === 'enter') {
                this.emit('enter');
            } else {
                this.emit('input', data);
            }
        };

        (this._interface as any).input.on('keypress', this._keypressListener);
    }

    /**
     * Registers our keypress interceptor by creating a readline interface and
     * capturing things like interrupts and standard keypresses
     */
    static register(rl?: readline.ReadLine): Input {
        return new Input(rl);
    }

    pause() {
        this._interface.pause();
    }

    resume() {
        this._interface.resume();
    }

    deregister() {
        this.removeAllListeners();
        (this._interface as any).input.removeListener('keypress', this._keypressListener);
        if (!this._hasExternalInterface) {
            this._interface.close();
        }
    }
}
