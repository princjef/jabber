import * as ava from 'ava';

import CommandHistory from './history';

function contextualize<T>(getContext: () => T): ava.RegisterContextual<T> {
    ava.test.beforeEach(t => {
        Object.assign(t.context, getContext());
    });

    return ava.test;
}

const existingHistory = () => [
    'some words',
    'other words',
    'some other words'
];

const test = contextualize(() => ({
    existingHistory: existingHistory(),
    history: CommandHistory.create(existingHistory())
}));

test('starts with no entry selected', t => {
    const history = CommandHistory.create();
    t.is(history.entry, null);
});

test('can be seeded with a history upon creation', t => {
    const history = CommandHistory.create(t.context.existingHistory);
    history.previousMatch('');
    t.not(history.entry, null);
});

test('previousMatch(): selects the previous match when available', t => {
    t.is(t.context.history.previousMatch(''), t.context.existingHistory[2]);
    t.is(t.context.history.entry, t.context.existingHistory[2]);
});

test('previousMatch(): continues to search backward on successive calls', t => {
    t.is(t.context.history.previousMatch(''), t.context.existingHistory[2]);
    t.is(t.context.history.entry, t.context.existingHistory[2]);

    t.is(t.context.history.previousMatch(''), t.context.existingHistory[1]);
    t.is(t.context.history.entry, t.context.existingHistory[1]);
});

test('previousMatch(): skips entries that do not match', t => {
    t.is(t.context.history.previousMatch('some'), t.context.existingHistory[2]);
    t.is(t.context.history.entry, t.context.existingHistory[2]);

    t.is(t.context.history.previousMatch('some'), t.context.existingHistory[0]);
    t.is(t.context.history.entry, t.context.existingHistory[0]);
});

test('previousMatch(): returns the earliest match if no more matches exist in the history', t => {
    t.is(t.context.history.previousMatch('some'), t.context.existingHistory[2]);
    t.is(t.context.history.entry, t.context.existingHistory[2]);

    t.is(t.context.history.previousMatch('some'), t.context.existingHistory[0]);
    t.is(t.context.history.entry, t.context.existingHistory[0]);

    // The last call will return null because there is no match, but leave the
    // match that was already found from the last call
    t.is(t.context.history.previousMatch('some'), null);
    t.is(t.context.history.entry, t.context.existingHistory[0]);
});

test('previousMatch(): returns null if no previous match is available', t => {
    t.is(t.context.history.previousMatch('gobledygook'), null);
    t.is(t.context.history.entry, null);
});

test('nextMatch(): selects the next match when available', t => {
    // First move up to the top of the history
    for (let i = 0; i < t.context.existingHistory.length; i++) {
        t.context.history.previousMatch('');
    }

    t.is(t.context.history.entry, t.context.existingHistory[0]);

    t.is(t.context.history.nextMatch(''), t.context.existingHistory[1]);
    t.is(t.context.history.entry, t.context.existingHistory[1]);
});

test('nextMatch(): continues to search forward on successive calls', t => {
    // First move up to the top of the history
    for (let i = 0; i < t.context.existingHistory.length; i++) {
        t.context.history.previousMatch('');
    }

    t.is(t.context.history.entry, t.context.existingHistory[0]);

    t.is(t.context.history.nextMatch(''), t.context.existingHistory[1]);
    t.is(t.context.history.entry, t.context.existingHistory[1]);

    t.is(t.context.history.nextMatch(''), t.context.existingHistory[2]);
    t.is(t.context.history.entry, t.context.existingHistory[2]);
});

test('nextMatch(): skips entries that do not match', t => {
    // First move up to the top of the history
    for (let i = 0; i < t.context.existingHistory.length; i++) {
        t.context.history.previousMatch('');
    }

    t.is(t.context.history.entry, t.context.existingHistory[0]);

    t.is(t.context.history.nextMatch('some'), t.context.existingHistory[2]);
    t.is(t.context.history.entry, t.context.existingHistory[2]);
});

test('nextMatch(): returns null if no more matches exist in the history', t => {
    // First move up to the top of the history
    for (let i = 0; i < t.context.existingHistory.length; i++) {
        t.context.history.previousMatch('');
    }

    t.is(t.context.history.entry, t.context.existingHistory[0]);

    t.is(t.context.history.nextMatch('some'), t.context.existingHistory[2]);
    t.is(t.context.history.entry, t.context.existingHistory[2]);

    // Both the match and entry are null because we've moved out of the history
    t.is(t.context.history.nextMatch('some'), null);
    t.is(t.context.history.entry, null);
});

test('nextMatch(): returns null if nothing below matches the pattern', t => {
    // First move up to the top of the history
    for (let i = 0; i < t.context.existingHistory.length; i++) {
        t.context.history.previousMatch('');
    }

    t.is(t.context.history.entry, t.context.existingHistory[0]);

    t.is(t.context.history.nextMatch('blergh'), null);
    t.is(t.context.history.entry, null);
});

test('inputEdited(): clears out the selection', t => {
    t.context.history.previousMatch('other');
    t.is(t.context.history.entry, t.context.existingHistory[1]);

    t.context.history.inputEdited();
    t.is(t.context.history.entry, null);
});

test('inputEdited(): preserves the location in history for subsequent matches', t => {
    t.context.history.previousMatch('other');
    t.is(t.context.history.entry, t.context.existingHistory[1]);

    t.context.history.inputEdited();

    t.is(t.context.history.previousMatch(''), t.context.existingHistory[0]);
    t.is(t.context.history.entry, t.context.existingHistory[0]);
});

test('inputEdited(): does not allow the selected entry at edit time to be selected', t => {
    t.context.history.previousMatch('other');
    t.is(t.context.history.entry, t.context.existingHistory[1]);

    t.context.history.inputEdited();

    t.is(t.context.history.previousMatch(''), t.context.existingHistory[0]);
    t.is(t.context.history.entry, t.context.existingHistory[0]);

    t.is(t.context.history.nextMatch(''), t.context.existingHistory[2]);
    t.is(t.context.history.entry, t.context.existingHistory[2]);
});

test('inputEdited(): does nothing if there is no selected entry', t => {
    t.is(t.context.history.entry, null);

    t.context.history.inputEdited();
    t.is(t.context.history.entry, null);

    t.is(t.context.history.previousMatch(''), t.context.existingHistory[2]);
    t.is(t.context.history.entry, t.context.existingHistory[2]);

    t.is(t.context.history.nextMatch(''), null);
    t.is(t.context.history.entry, null);
});

test('addEntry(): adds a new entry without resetting the search', t => {
    t.context.history.previousMatch('');
    t.is(t.context.history.entry, t.context.existingHistory[2]);

    const newCommand = 'new stuff';
    t.context.history.addEntry(newCommand);

    t.is(t.context.history.nextMatch(''), newCommand);
    t.is(t.context.history.entry, newCommand);

    t.is(t.context.history.nextMatch(''), null);
    t.is(t.context.history.entry, null);
});

test('resetSearch(): clears out the search entry', t => {
    t.context.history.previousMatch('');
    t.is(t.context.history.entry, t.context.existingHistory[2]);

    t.context.history.resetSearch();
    t.is(t.context.history.entry, null);

    t.is(t.context.history.previousMatch(''), t.context.existingHistory[2]);
    t.is(t.context.history.entry, t.context.existingHistory[2]);
});

test('resetSearch(): re-enables locked entries due to input edits', t => {
    t.context.history.previousMatch('other');
    t.is(t.context.history.entry, t.context.existingHistory[1]);

    t.context.history.inputEdited();

    t.context.history.nextMatch('');
    t.is(t.context.history.entry, t.context.existingHistory[2]);

    t.context.history.previousMatch('other');
    t.is(t.context.history.entry, t.context.existingHistory[2]);

    t.context.history.resetSearch();
    t.is(t.context.history.entry, null);

    t.context.history.previousMatch('other');
    t.is(t.context.history.entry, t.context.existingHistory[1]);
});
