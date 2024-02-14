import { isWhiteSpace } from "./charcode.js";
import type { Comment, TypeSpecScriptNode } from "./types.js";

/**
 * Find the comment that is at given position, if any.
 *
 * A comment is at the given position if {@link Comment.pos} <= position <
 * {@link Comment.end}. Unlike {@link getNodeAtPosition}, the end node is
 * not included since comments can be adjacent to each other with no trivia
 * or punctuation between them.
 *
 * @internal
 */
export function getCommentAtPosition(script: TypeSpecScriptNode, pos: number): Comment | undefined {
  if (!script.parseOptions.comments) {
    // Not an assert since we might make this public and it would be external caller's responsibility.
    throw new Error("ParseOptions.comments must be enabled to use getCommentAtPosition.");
  }

  // Comments are ordered by increasing position, use binary search
  let low = 0;
  let high = script.comments.length - 1;
  while (low <= high) {
    const middle = low + ((high - low) >> 1);
    const candidate = script.comments[middle];
    if (pos >= candidate.end) {
      low = middle + 1;
    } else if (pos < candidate.pos) {
      high = middle - 1;
    } else {
      return candidate;
    }
  }
  return undefined;
}

/**
 * Adjust the given postion backwards before any trivia.
 */
export function getPositionBeforeTrivia(script: TypeSpecScriptNode, pos: number): number {
  if (!script.parseOptions.comments) {
    // Not an assert since we might make this public and it would be external caller's responsibility.
    throw new Error("ParseOptions.comments must be enabled to use getPositionBeforeTrivia.");
  }

  let comment: Comment | undefined;

  while (pos > 0) {
    if (isWhiteSpace(script.file.text.charCodeAt(pos - 1))) {
      do {
        pos--;
      } while (isWhiteSpace(script.file.text.charCodeAt(pos - 1)));
    } else if ((comment = getCommentAtPosition(script, pos - 1))) {
      pos = comment.pos;
    } else {
      // note at whitespace or comment
      break;
    }
  }

  return pos;
}
