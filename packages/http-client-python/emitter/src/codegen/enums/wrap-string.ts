// -------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for
// license information.
// --------------------------------------------------------------------------

/**
 * TypeScript re-implementation of the `wrap_string` Jinja macro used by pygen
 * (generator/pygen/codegen/templates/operation_tools.jinja2) together with
 * Jinja2's `wordwrap` filter. Black does not re-wrap docstring contents, so the
 * wrapping has to match pygen exactly for the rendered `_enums.py` to be
 * byte-identical after formatting.
 */

const DEFAULT_WIDTH = 95;

/**
 * Greedy word wrap that mirrors Python `textwrap.wrap` for the parameters pygen
 * uses (`break_long_words=False`, `break_on_hyphens=False`, and whitespace that
 * has already been collapsed to single spaces). Words longer than `width` are
 * kept on their own line rather than broken.
 */
function wrapLine(line: string, width: number): string[] {
  const words = line.split(" ").filter((w) => w.length > 0);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current === "") {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current !== "") {
    lines.push(current);
  }
  return lines;
}

function wordwrap(text: string, width: number, wrapstring: string): string {
  // Python str.splitlines() — split on newlines without a trailing empty entry.
  const sourceLines = text.split("\n");
  return sourceLines.map((line) => wrapLine(line, width).join(wrapstring)).join(wrapstring);
}

/**
 * Mirrors the `wrap_string` macro: optionally collapse internal newlines to
 * spaces, escape backslashes, then word-wrap with the given continuation string.
 */
export function wrapString(
  text: string,
  wrapstring: string,
  width: number = DEFAULT_WIDTH,
): string {
  let normalized = text;

  // The macro only normalizes "simple" prose: no bullet blocks ("\n* "), no
  // leading whitespace, and no blank-line-separated paragraphs.
  if (!text.includes("\n* ") && text === text.replace(/^\s+/, "")) {
    if (text.includes(".. code-block::")) {
      // Split at the first code block and only normalize the prose before it.
      const parts = text.split(".. code-block::");
      const prose = parts[0].replace(/\s+$/, "");
      const codeBlock = ".. code-block::" + parts.slice(1).join(".. code-block::");
      if (!prose.includes("\n\n")) {
        const proseLines = prose
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        normalized = proseLines.join(" ") + "\n\n" + codeBlock;
      }
    } else if (!text.includes("\n\n")) {
      normalized = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join(" ");
    }
  }

  const escaped = normalized.replace(/\\/g, "\\\\");
  return wordwrap(escaped, width, wrapstring);
}
