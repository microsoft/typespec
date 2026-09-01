import { describe, expect, it } from "vitest";
import { cleanupBody, parseJsonLines } from "./body-utils.js";

describe("cleanupBody()", () => {
  it("remove trailing whitespaces", () => {
    expect(cleanupBody("  foo     ")).toEqual("foo");
  });

  it("remove trailing new lines", () => {
    expect(cleanupBody("\nfoo\nbar\n")).toEqual("foo\nbar");
  });

  it("replace windows line endings", () => {
    expect(cleanupBody("foo\r\nbar")).toEqual("foo\nbar");
  });
});

describe("parseJsonLines()", () => {
  it("parses compact and spaced JSON equivalently", () => {
    const compact = '{"desc":"one"}\n{"desc":"two"}';
    const spaced = '{"desc": "one"}\n{"desc": "two"}';

    expect(parseJsonLines(compact)).toEqual(parseJsonLines(spaced));
  });

  it("accepts CRLF and a final line terminator", () => {
    expect(parseJsonLines('{"desc":"one"}\r\n{"desc":"two"}\r\n')).toEqual([
      { desc: "one" },
      { desc: "two" },
    ]);
  });

  it("rejects blank JSON Lines", () => {
    expect(() => parseJsonLines('{"desc":"one"}\n\n{"desc":"two"}')).toThrow();
  });
});
