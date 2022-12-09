import { CadlRefDoc, DecoratorRefDoc } from "../types.js";
import { getTypeSignature } from "../utils/type-signature.js";

/**
 * Render doc to a markdown using docusaurus addons.
 */
export function renderToDocusaurusMarkdown(refDoc: CadlRefDoc): Record<string, string> {
  return {
    "decorators.md": renderDecoratorFile(refDoc),
  };
}

function renderDecoratorFile(refDoc: CadlRefDoc) {
  let markdownString: string = "# Decorators";
  for (const dec of refDoc.decorators) {
    if (dec.name !== "@service") {
      continue;
    }
    markdownString += renderDecoratorMarkdown(dec) + "\n\n";
  }
  return markdownString;
}

function codeblock(code: string, lang: string = "") {
  return "```" + lang + "\n" + code + "\n" + "```";
}
function inlinecode(code: string) {
  return "`" + code + "`";
}

function table([header, ...rows]: string[][]) {
  const renderRow = (row: string[]): string => `| ${row.join(" | ")} |`;

  return [
    renderRow(header),
    "|" + header.map((x) => "-".repeat(x.length + 2)).join("|") + "|",
    ...rows.map(renderRow),
  ].join("\n");
}

function renderDecoratorMarkdown(dec: DecoratorRefDoc): string {
  const content = [`## \`${dec.name}\``, "", dec.doc, codeblock(dec.signature, "cadl"), ""];

  content.push(
    "### Target",
    dec.target.doc,
    inlinecode(getTypeSignature(dec.target.type.type)),
    ""
  );

  const paramTable: string[][] = [["Name", "Type", "Description"]];
  for (const param of dec.parameters) {
    paramTable.push([param.name, inlinecode(getTypeSignature(param.type.type)), param.doc]);
  }
  content.push("### Parameters", table(paramTable), "");

  content.push("### Examples");
  for (const example of dec.examples) {
    if (example.title) {
      content.push(`#### ${example.title}`);
    }
    content.push("", example.content, "");
  }

  return content.join("\n");
}
