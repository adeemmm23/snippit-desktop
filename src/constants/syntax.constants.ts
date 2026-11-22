/**
 * The template syntax. This file is the single definition of it; the parser in
 * `stores/editor/utils.ts` only composes these patterns.
 *
 *   Variable        {Name}
 *   Literal braces  {{Name}}            renders as the text {Name}
 *   Comment         #! note !#          never copied, may span lines
 *   Repeated block  #? Name             on its own line
 *                   ...body...
 *                   ?#                  on its own line
 *
 * Every pattern is meant for the `u` flag, and the line anchored ones for `m`.
 */

// Letters of any script (accents and Arabic included), combining marks,
// digits and underscore.
const NAME_CHARS = "\\p{L}\\p{M}\\p{N}_";

/**
 * A variable name: name characters with spaces between them. It can't start
 * or end with a space and can't hold anything else, so `{ ls }`, `{}` and the
 * braces of a pasted JSON snippet stay plain text.
 */
export const VARIABLE_NAME = `[${NAME_CHARS}](?:[${NAME_CHARS} ]*[${NAME_CHARS}])?`;

/** The name of a repeated block, up to the end of its line. */
export const BLOCK_NAME = "[^\\s#][^\\r\\n]*?";

/** A line that opens a repeated block. Capture group 1 is the block name. */
export const BLOCK_OPEN_LINE = `^[ \\t]*#\\?[ \\t]*(${BLOCK_NAME})[ \\t]*$`;

/** A line that closes a repeated block. */
export const BLOCK_CLOSE_LINE = "^[ \\t]*\\?#[ \\t]*$";

/** `#!` starts a comment unless a `/` follows, which is a script shebang. */
export const COMMENT_OPEN = "#!(?!\\/)";
export const COMMENT_CLOSE = "!#";
