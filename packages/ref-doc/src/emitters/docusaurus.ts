import prettier from "prettier";
import { CadlRefDoc, DecoratorRefDoc } from "../types.js";
import { codeblock, headings, inlinecode, table } from "../utils/markdown.js";
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
  const content = [
    "---",
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
    "---",
    headings.h1("Decorators"),
  ];
  for (const namespace of refDoc.namespaces) {
    content.push(headings.h2(namespace.fullName), "");

    for (const dec of namespace.decorators) {
      content.push(renderDecoratorMarkdown(dec), "");
    }
  }
  const markdownString = content.join("\n");
  try {
    return prettier.format(markdownString, {
      parser: "markdown",
    });
  } catch (e) {
    console.error("Cannot format with prettier");
    return markdownString;
  }
}

function renderDecoratorMarkdown(dec: DecoratorRefDoc, headingLevel: number = 3): string {
  const content = [
    headings.hx(headingLevel, inlinecode(dec.name)),
    "",
    dec.doc,
    codeblock(dec.signature, "cadl"),
    "",
  ];

  content.push(
    headings.hx(headingLevel + 1, "Target"),
    dec.target.doc,
    inlinecode(getTypeSignature(dec.target.type.type)),
    ""
  );

  const paramTable: string[][] = [["Name", "Type", "Description"]];
  for (const param of dec.parameters) {
    paramTable.push([param.name, inlinecode(getTypeSignature(param.type.type)), param.doc]);
  }
  content.push(headings.hx(headingLevel + 1, "Parameters"), table(paramTable), "");

  if (dec.examples.length > 0) {
    content.push(headings.hx(headingLevel + 1, "Examples"));
    for (const example of dec.examples) {
      if (example.title) {
        content.push(headings.hx(headingLevel + 2, example.title));
      }
      content.push("", example.content, "");
    }
  }

  return content.join("\n");
}
