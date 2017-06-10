import * as ava from 'ava';
import * as chalk from 'chalk';

import Completion from './completion';

function contextualize<T>(getContext: () => T): ava.RegisterContextual<T> {
    ava.test.beforeEach(t => {
        Object.assign(t.context, getContext());
    });

    return ava.test;
}

const test = contextualize(() => ({
    completions: [
        'and',
        'form',
        'any',
        'other',
        'multiple words'
    ]
}));

test('filters the options based on the last argument', t => {
    const completion = Completion.populate(['one', 'a'], t.context.completions);
    t.is(completion.possibleCompletionCount, 2);
    t.is(completion.selection, null);
});

test('performs no filter when the last argument matches none of the arguments', t => {
    const completion = Completion.populate(['some', 'goobledygook'], t.context.completions);
    t.is(completion.possibleCompletionCount, t.context.completions.length);
    t.is(completion.selection, null);
});

test('selects nothing when multiple valid options are present', t => {
    const completion = Completion.populate([''], t.context.completions);
    t.is(completion.possibleCompletionCount, t.context.completions.length);
    t.is(completion.selection, null);
});

test('selects the only valid option when provided', t => {
    const completion = Completion.populate(['oth'], t.context.completions);
    t.is(completion.possibleCompletionCount, 1);
    t.is(completion.selection, 'other');
});

test('selectNext(): selects the first completion when none are selected', t => {
    const completion = Completion.populate([''], t.context.completions);
    t.is(completion.selection, null);

    completion.selectNext();
    t.is(completion.selection, t.context.completions[0]);
});

test('selectNext(): selects the next completion when a completion other than the last is selected', t => {
    const completion = Completion.populate(['a'], t.context.completions);
    t.is(completion.selection, null);

    completion.selectNext();
    t.is(completion.selection, 'and');

    completion.selectNext();
    t.is(completion.selection, 'any');
});

test('selectNext(): selects the first completion when the last completion is selected', t => {
    const completion = Completion.populate(['a'], t.context.completions);
    t.is(completion.selection, null);

    completion.selectNext();
    t.is(completion.selection, 'and');

    completion.selectNext();
    t.is(completion.selection, 'any');

    completion.selectNext();
    t.is(completion.selection, 'and');
});

test('selectPrevious(): selects the last completion when none are selected', t => {
    const completion = Completion.populate([''], t.context.completions);
    t.is(completion.selection, null);

    completion.selectPrevious();
    t.is(completion.selection, t.context.completions[t.context.completions.length - 1]);
});

test('selectPrevious(): selects the previous completion when a completion other than the first is selected', t => {
    const completion = Completion.populate([''], t.context.completions);
    t.is(completion.selection, null);

    completion.selectPrevious();
    t.is(completion.selection, t.context.completions[t.context.completions.length - 1]);

    completion.selectPrevious();
    t.is(completion.selection, t.context.completions[t.context.completions.length - 2]);
});

test('selectPrevious(): selects the last completion when the first completion is selected', t => {
    const completion = Completion.populate(['a'], t.context.completions);
    t.is(completion.selection, null);

    completion.selectPrevious();
    t.is(completion.selection, 'any');

    completion.selectPrevious();
    t.is(completion.selection, 'and');

    completion.selectPrevious();
    t.is(completion.selection, 'any');
});

test('renderCommand(): shows the provided command if no selections are chosen', t => {
    const completion = Completion.populate([''], t.context.completions);
    t.is(completion.selection, null);

    const command = 'some command';
    t.is(completion.renderCommand(command), command);
});

test('renderCommand(): fills in the last argument with the given selection when it matches', t => {
    const completion = Completion.populate(['some', 'ot'], t.context.completions);
    t.is(completion.selection, 'other');

    const command = 'some ot';
    t.is(completion.renderCommand(command), 'some other');
});

test('renderCommand(): ensures a space is present and shows the selection at the end if it doesn\'t match the last argument', t => {
    const completion = Completion.populate(['some', 'gobbledygook'], t.context.completions);
    t.is(completion.selection, null);

    completion.selectNext();
    t.is(completion.selection, t.context.completions[0]);

    const command = 'some goobledygook';
    t.is(completion.renderCommand(command), `${command} ${t.context.completions[0]}`);
});

test('renderCommand(): adds the selection to the end of the command if the command ends in whitespace', t => {
    const completion = Completion.populate(['some', 'gobbledygook'], t.context.completions);
    t.is(completion.selection, null);

    completion.selectNext();
    t.is(completion.selection, t.context.completions[0]);

    const command = 'some goobledygook ';
    t.is(completion.renderCommand(command), `${command}${t.context.completions[0]}`);
});

test('renderOptions(): returns all options normalized to the length of the longest option', t => {
    const options = [
        'short',
        'superlongggggg',
        'two words'
    ];
    const completion = Completion.populate([''], options);

    t.deepEqual(completion.renderOptions(), [
        'short         ',
        'superlongggggg',
        'two words     '
    ]);
});

test('renderOptions(): inverts the colors on the current selection when present', t => {
    const options = [
        'short',
        'superlongggggg',
        'two words'
    ];
    const completion = Completion.populate([''], options);
    completion.selectNext();
    t.is(completion.selection, 'short');

    t.deepEqual(completion.renderOptions(), [
        chalk.inverse('short         '),
        'superlongggggg',
        'two words     '
    ]);
});
