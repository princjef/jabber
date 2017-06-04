import test from 'ava';

import CommandHistory from './history';

test('starts with no entry selected', t => {
    const history = CommandHistory.create();
    t.is(history.entry, null);
});
