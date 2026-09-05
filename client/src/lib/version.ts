/*
 * Shown in the footer as V:x so a screenshot always says which build it came
 * from — worth more than it looks when someone reports a bug from a tab they
 * opened before the last deploy.
 *
 * Bumped once per push, not once per change: one decimal at a time, and 1.9
 * rolls to 2.0 rather than 1.10.
 */
export const APP_VERSION = '1.2';
