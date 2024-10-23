import { deepStrictEqual, ok, strictEqual, throws } from "assert";
import { describe, it } from "vitest";
import { Comment } from "../../src/core/index.js";
import { getCommentAtPosition, getPositionBeforeTrivia } from "../../src/core/parser-utils.js";
import { parse } from "../../src/core/parser.js";
import { TypeSpecScriptNode } from "../../src/core/types.js";
import { extractCursor } from "../../src/testing/test-server-host.js";
import { dumpAST } from "../ast-test-utils.js";

describe("compiler: parser-utils", () => {
  describe("getCommentAtPosition", () => {
    function getCommentAtCursor(
      sourceWithCursor: string,
      comments = true,
    ): {
      root: TypeSpecScriptNode;
      comment: Comment | undefined;
    } {
      const { source, pos } = extractCursor(sourceWithCursor);
      const root = parse(source, { comments });
      dumpAST(root);
      return { comment: getCommentAtPosition(root, pos), root };
    }

    it("finds one of multiple comments", () => {
      const { root, comment } = getCommentAtCursor(`
        /* First comment */
        // Second comment 
        /**
         * Third comment ┆
         */
      `);
      ok(comment);
      deepStrictEqual(comment, root.comments[2]);
    });

    it("does not find outside comment", () => {
      const { comment } = getCommentAtCursor(`
        /* First comment */
        ┆
        /* Second comment */
        /* Third comment */
      `);
      ok(!comment);
    });

    it("handles adjacent comments", () => {
      // Since the start position is included and end position is not, the
      // right of cursor should be returned.
      const { root, comment } = getCommentAtCursor(`
        /* First comment */┆/*Second comment */
      `);
      ok(comment);
      deepStrictEqual(comment, root.comments[1]);
    });

    it("throws if comments are not enabled", () => {
      throws(() => getCommentAtCursor(`┆`, false));
    });
  });

  describe("getPositionBeforeTrivia", () => {
    function getPositionBeforeTriviaAtCursor(
      sourceWithCursor: string,
      comments = true,
    ): {
      pos: number;
      root: TypeSpecScriptNode;
    } {
      const { source, pos } = extractCursor(sourceWithCursor);
      const root = parse(source, { comments });
      dumpAST(root);
      return { pos: getPositionBeforeTrivia(root, pos), root };
    }

    const testSourceWithoutTrailingTrivia = `model Test {}`;

    it("returns position unchanged with no trivia", () => {
      const { pos } = getPositionBeforeTriviaAtCursor(`${testSourceWithoutTrailingTrivia}┆`);
      strictEqual(pos, testSourceWithoutTrailingTrivia.length);
    });

    it("returns correct position before whitespace", () => {
      const { pos } = getPositionBeforeTriviaAtCursor(`${testSourceWithoutTrailingTrivia} ┆`);
      strictEqual(pos, testSourceWithoutTrailingTrivia.length);
    });

    it("returns correct position before trivia with cursor exactly at the end of comment", () => {
      const { pos } = getPositionBeforeTriviaAtCursor(`model Test {} /* Test */┆`);
      strictEqual(pos, testSourceWithoutTrailingTrivia.length);
    });

    it("returns correct position before lots of trivia with cursor in the middle of comment", () => {
      const { pos } = getPositionBeforeTriviaAtCursor(
        `model Test {} /* Test */ 
        // More

        /*
        More
        */

        /** 
         * Inside the last comment ┆ over here
         */`,
      );
      strictEqual(pos, testSourceWithoutTrailingTrivia.length);
    });

    it("throws if comments are not enabled", () => {
      throws(() => getPositionBeforeTriviaAtCursor(`┆`, false));
    });
  });
});
