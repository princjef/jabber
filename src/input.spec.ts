import test from 'ava';

test.todo('sets raw mode for tty streams');

test.todo('doesn\'t set raw mode for non-tty streams');

test.todo('listens to keypress events');

test.todo('uses the provided readline interface when given');

test.todo('emits an \'interrupt\' event on Ctrl-C');

test.todo('emits an \'up\' event on the up key pressed');

test.todo('emits a \'down\' event on the down key pressed');

test.todo('emits a \'tab\' event along with whether the shift key was pressed on shift');

test.todo('emits an \'enter\' event if the enter or return keys are pressed');

test.todo('emits an \'input\' event with the data from any other keypress');

test.todo('pause(): pauses the underlying interface');

test.todo('resume(): resumes the underlying interface');

test.todo('deregister(): removes all listeners and closes the interface');
