import { logVerboseTestOutput } from "../src/core/diagnostics.js";
import { hasParseError } from "../src/core/parser.js";
import { Node, NodeFlags, SourceFile, SyntaxKind } from "../src/core/types.js";

export function dumpAST(astNode: Node, file?: SourceFile) {
  if (!file && astNode.kind === SyntaxKind.TypeSpecScript) {
    file = astNode.file;
  }
  logVerboseTestOutput((log) => {
    hasParseError(astNode); // force flags to initialize
    const json = JSON.stringify(astNode, replacer, 2);
    log(json);
  });

  function replacer(key: string, value: any) {
    if (key === "parent") {
      return undefined; // prevent cycles if run on bound nodes
    }
    if (key === "kind") {
      // swap numeric kind for readable name
      return SyntaxKind[value];
    }

    if (file && (key === "pos" || key === "end")) {
      // include line and column numbers
      const pos = file.getLineAndCharacterOfPosition(value);
      const line = pos.line + 1;
      const col = pos.character + 1;
      return `${value} (line ${line}, column ${col})`;
    }

    if (key === "parseDiagnostics" || key === "file") {
      // these will be logged separately in more readable form
      return undefined;
    }

    if (Array.isArray(value) && value.length === 0) {
      // hide empty arrays too
      return undefined;
    }

    if (key === "flags") {
      return [
        value & NodeFlags.DescendantErrorsExamined ? "DescendantErrorsExamined" : "",
        value & NodeFlags.ThisNodeHasError ? "ThisNodeHasError" : "",
        value & NodeFlags.DescendantHasError ? "DescendantHasError" : "",
      ].join(",");
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      // Show the text of the given node
      if (file && "pos" in value && "end" in value) {
        value.source = shorten(file.text.substring(value.pos, value.end));
      }

      // sort properties by type so that the short ones can be read without
      // scrolling past the long ones and getting disoriented.
      const sorted: any = {};
      for (const prop of sortKeysByType(value)) {
        sorted[prop] = value[prop];
      }
      return sorted;
    }

    return value;
  }

  function sortKeysByType(o: any) {
    const score = {
      undefined: 0,
      string: 1,
      boolean: 2,
      number: 3,
      bigint: 4,
      symbol: 5,
      function: 6,
      object: 7,
    };
    return Object.keys(o).sort((x, y) => score[typeof o[x]] - score[typeof o[y]]);
  }
}

function shorten(code: string) {
  return code.replace(/\s+/g, " ");
}
