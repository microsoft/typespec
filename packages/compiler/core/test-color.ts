import chalk from "chalk";
import { hasParseError, NodeFlags, parse } from "./parser.js";
import { Node, SourceFile, SyntaxKind } from "./types.js";

const code = `
import "@cadl/rest";

@dec(1, 2)
@dec(3, 4)
namespace x;
  model X {
    prop: int32;
    otherProp: string;
  }

  interface Y {
  }
`;
const primitiveExcludes = ["kind", "flags"];

const style = {
  node: chalk.bold.inverse,
  id: chalk.magenta.bold.inverse,
  string: chalk.hex("#eaedab"),
  number: chalk.hex("#eaedab"),
  boolean: chalk.hex("#eaedab"),
  shortProp: chalk.grey.bold,
  prop: chalk.dim,
  flag: chalk.reset,
};

const ast = parse(code);
const printer = createPrinter();
printer.inspectNode(ast);
// dumpAST(ast);
function createPrinter(depth = Infinity) {
  return {
    inspectNode: inspectNodePublic,
  };

  function inspectNodePublic(node: Node) {
    console.log(inspectNode(node));
  }

  function inspectValue(value: unknown) {
    let nodeContents = "";
    if (typeof value === "object" && value !== null) {
      if ("kind" in value) {
        nodeContents = inspectNode(value as Node).trim();
      } else if (value instanceof Map) {
        nodeContents += inspectMap(value);
      } else if (Array.isArray(value)) {
        nodeContents += inspectArray(value);
      } else {
        nodeContents = inspectObject(value);
      }
    } else {
      nodeContents = inspectPrimitive(value as any).trim();
    }

    return nodeContents;
  }

  function inspectMap(map: Map<unknown, unknown>) {
    let contents = style.shortProp("size") + ": " + style.number(map.size) + "\n";
    for (const [key, value] of map) {
      contents += inspectValue(key) + " => " + inspectValue(value);
    }
    return contents;
  }

  function inspectNode(node: Node) {
    let contents = "";
    contents += nodeName(node);
    const visited = new Set(primitiveExcludes);

    if ("id" in node) {
      const name = node.id.kind === SyntaxKind.Identifier ? node.id.sv : node.id.value;
      contents += "  " + style.id(" " + name + " ");
    }

    for (const [key, value] of Object.entries(node)) {
      if (visited.has(key)) continue;
      if (typeof value === "boolean" || typeof value === "string" || typeof value === "number") {
        visited.add(key);
        contents += "  " + inspectPrimitiveField(key, value);
      }
    }

    if ("flags" in node) {
      contents += "  " + inspectFlags((node as any).flags);
    }

    let expandedContent = "";

    for (const [key, value] of Object.entries(node)) {
      if (visited.has(key)) continue;
      if (value === undefined) continue;
      if (Array.isArray(value) && value.length === 0) continue;
      if (value instanceof Map && value.size === 0) continue;
      expandedContent +=
        style.prop(key) +
        (Array.isArray(value) ? "[]" : "") +
        ": " +
        inspectValue(value).trim() +
        "\n";
    }

    return contents + "\n" + blockIndent(expandedContent);
  }

  function inspectObject(obj: any) {
    let primitiveContents = "";
    let expandedContents = "";

    for (const [key, value] of Object.entries(obj)) {
      if (primitiveExcludes.includes(key)) continue;
      if (typeof value === "boolean" || typeof value === "string" || typeof value === "number") {
        if (typeof value === "string" && (value.length > 20 || value.indexOf("\n") > -1)) {
          expandedContents += inspectObjectProperty(key, value);
        } else {
          primitiveContents += inspectPrimitiveField(key, value) + "  ";
        }
      }
    }

    return [primitiveContents, blockIndent(expandedContents)].join("\n").trim();
  }

  function inspectObjectProperty(key: string, value: any) {
    return style.prop(key) + ": " + inspectValue(value) + "\n";
  }

  function nodeName(node: Node) {
    return chalk.bold(chalk.inverse(` ${SyntaxKind[node.kind]} `));
  }

  function inspectArrayProperty(key: string, value: Node[]) {
    let contents = style.prop(key + "[]: ") + inspectArray(value);

    return contents;
  }

  function inspectArray(value: unknown[]) {
    let contents = style.shortProp("length") + ": " + style.number(value.length) + "\n";

    // don't need to indent node arrays as the node name serves as a fine separator
    const isNodeArray = typeof value[0] === "object" && value[0] !== null && "kind" in value[0];
    for (const item of value) {
      let valueContents = inspectValue(item);
      contents += isNodeArray ? valueContents + "\n" : blockIndent(valueContents) + "\n";
    }

    return contents;
  }

  function inspectFlags(flags: NodeFlags) {
    let text = `${chalk.grey(chalk.bold("flags"))}: `;
    if (flags === 0) {
      text += chalk.grey("none");
    } else {
      text += "[";
      if (flags & NodeFlags.DescendantErrorsExamined) {
        text += "DescendantErrorsExamined";
      }

      if (flags & NodeFlags.ThisNodeHasError) {
        text += "ThisNodeHasError";
      }

      if (flags & NodeFlags.DescendantHasError) {
        text += "DescendantHasError";
      }

      if (flags & NodeFlags.Synthetic) {
        text += "Synthetic";
      }
      text += "]";
    }

    return text;
  }

  function inspectPrimitiveField(key: string, value: boolean | string | number) {
    return style.shortProp(key) + ": " + inspectPrimitive(value);
  }

  function inspectPrimitive(value: boolean | string | number) {
    switch (typeof value) {
      case "boolean":
        return style.boolean(value);
      case "number":
        return style.number(value);
      case "string":
        return style.string("'" + value + "'");
      case "undefined":
        return style.boolean(value);
    }
  }

  function indent(
    contents: string,
    single: string,
    start: string = single,
    middle: string = single,
    end: string = single
  ) {
    const lines = contents.trim().split("\n");
    if (lines.length === 1) {
      return single + lines[0];
    }
    for (const [i, line] of lines.entries()) {
      if (i === 0) {
        lines[i] = start + line;
      } else if (i === lines.length - 1) {
        lines[i] = end + line;
      } else {
        lines[i] = middle + line;
      }
    }

    return lines.join("\n");
  }

  function isPrimitive(value: unknown): value is string | number | boolean {
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
  }

  function blockIndent(str: string) {
    if (str.trim().length === 0) {
      return str;
    }
    return indent(str, "╶ ", "┌ ", "│ ", "└ ");
  }
}

function dumpAST(astNode: Node, file?: SourceFile) {
  if (!file && astNode.kind === SyntaxKind.CadlScript) {
    file = astNode.file;
  }

  hasParseError(astNode); // force flags to initialize
  const json = JSON.stringify(astNode, replacer, 2);
  console.log(json);

  function replacer(key: string, value: any) {
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

    if (key === "locals" && value.size === 0) {
      // this will be an empty symbol table after parsing, hide it
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
