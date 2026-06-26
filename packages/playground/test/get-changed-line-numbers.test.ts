import { describe, expect, it } from "vitest";
import { getChangedLineNumbers } from "../src/react/diff-utils.js";

describe("getChangedLineNumbers", () => {
  it("returns empty array when texts are identical", () => {
    const text = "line1\nline2\nline3";
    expect(getChangedLineNumbers(text, text)).toEqual([]);
  });

  it("returns all line numbers when old text is empty", () => {
    const result = getChangedLineNumbers("", "line1\nline2\nline3");
    expect(result).toEqual([1, 2, 3]);
  });

  it("returns empty array when new text is empty", () => {
    const result = getChangedLineNumbers("line1\nline2", "");
    // The empty string splits into [""], which is 1 line that doesn't match any old line
    expect(result).toEqual([1]);
  });

  it("detects a single changed line", () => {
    const oldText = "line1\nline2\nline3";
    const newText = "line1\nmodified\nline3";
    const result = getChangedLineNumbers(oldText, newText);
    expect(result).toEqual([2]);
  });

  it("detects inserted lines", () => {
    const oldText = "line1\nline3";
    const newText = "line1\nline2\nline3";
    const result = getChangedLineNumbers(oldText, newText);
    expect(result).toEqual([2]);
  });

  it("detects multiple changed lines", () => {
    const oldText = "alpha\nbeta\ngamma\ndelta";
    const newText = "alpha\nXXX\ngamma\nYYY";
    const result = getChangedLineNumbers(oldText, newText);
    expect(result).toEqual([2, 4]);
  });

  it("returns 1-based line numbers (Monaco convention)", () => {
    const oldText = "unchanged";
    const newText = "changed";
    const result = getChangedLineNumbers(oldText, newText);
    expect(result).toEqual([1]);
  });

  it("handles completely different content", () => {
    const oldText = "apple\nbanana\ncherry";
    const newText = "mango\norange\npeach";
    const result = getChangedLineNumbers(oldText, newText);
    expect(result).toEqual([1, 2, 3]);
  });

  it("handles appended lines", () => {
    const oldText = "line1\nline2";
    const newText = "line1\nline2\nline3\nline4";
    const result = getChangedLineNumbers(oldText, newText);
    expect(result).toEqual([3, 4]);
  });

  it("handles deleted lines (only remaining lines counted)", () => {
    const oldText = "line1\nline2\nline3\nline4";
    const newText = "line1\nline4";
    const result = getChangedLineNumbers(oldText, newText);
    // line1 and line4 are matched, nothing is "changed" in the new text
    expect(result).toEqual([]);
  });

  it("handles reordered lines as changes", () => {
    const oldText = "apple\nbanana\ncherry";
    const newText = "cherry\nbanana\napple";
    // Greedy forward scan: cherry at index 0 matches old[2], then banana/apple can't match forward
    const result = getChangedLineNumbers(oldText, newText);
    expect(result).toEqual([2, 3]);
  });
});
