import test from 'ava';

test.todo('filters the options based on the last argument');

test.todo('performs no filter when the last argument matches none of the arguments');

test.todo('selects nothing when multiple valid options are present');

test.todo('selects the only valid option when provided');

test.todo('selectNext(): selects the first completion when none are selected');

test.todo('selectNext(): selects the next completion when a completion other than the last is selected');

test.todo('selectNext(): selects the first completion when the last completion is selected');

test.todo('selectPrevious(): selects the last completion when none are selected');

test.todo('selectPrevious(): selects the previous completion when a completion other than the first is selected');

test.todo('selectPrevious(): selects the last completion when the first completion is selected');

test.todo('renderCommand(): shows the provided command if no selections are chosen');

test.todo('renderCommand(): fills in the last argument with the given selection when it matches');

test.todo('renderCommand(): adds a space to the end of the command if the last argument doesn\'t match any selections and none are selected');

test.todo('renderCommand(): ensures a space is present and shows the selection at the end if it doesn\'t match the last argument');

test.todo('renderCommand(): adds the selection to the end of the command if the command ends in whitespace');

test.todo('renderOptions(): returns all options mernalized to the length of the longest option');

test.todo('renderOptions(): inverts the colors on the current selection when present');
