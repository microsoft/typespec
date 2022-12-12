import prettier from "prettier";
import {
  CadlRefDoc,
  DecoratorRefDoc,
  InterfaceRefDoc,
  OperationRefDoc,
  TemplateParameterRefDoc,
} from "../types.js";
import { codeblock, headings, inlinecode, table } from "../utils/markdown.js";
import { getTypeSignature } from "../utils/type-signature.js";

/**
 * Render doc to a markdown using docusaurus addons.
 */
export function renderToDocusaurusMarkdown(refDoc: CadlRefDoc): Record<string, string> {
  const files: Record<string, string> = {};

  const decoratorFile = renderDecoratorFile(refDoc);
  if (decoratorFile) {
    files["decorators.md"] = decoratorFile;
  }

  const interfaceFile = renderInterfacesFile(refDoc);
  if (interfaceFile) {
    files["interfaces.md"] = interfaceFile;
  }

  return files;
}

function renderDecoratorFile(refDoc: CadlRefDoc): string | undefined {
  if (!refDoc.namespaces.some((x) => x.decorators.length > 0)) {
    return undefined;
  }
  const content = [
    "---",
    `title: "Decorators"`,
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
    headings.hx(headingLevel, `${inlinecode(dec.name)} {#${dec.id}}`),
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

function renderInterfacesFile(refDoc: CadlRefDoc): string | undefined {
  if (!refDoc.namespaces.some((x) => x.operations.length > 0 || x.interfaces.length > 0)) {
    return undefined;
  }
  const content = [
    "---",
    `title: "Interfaces and Operations"`,
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
    "---",
    headings.h1("Interfaces and Operations"),
  ];
  for (const namespace of refDoc.namespaces) {
    if (namespace.operations.length === 0 && namespace.interfaces.length === 0) {
      continue;
    }
    content.push(headings.h2(namespace.fullName), "");

    for (const iface of namespace.interfaces) {
      content.push(renderInterfaceMarkdown(iface), "");
    }

    for (const operation of namespace.operations) {
      content.push(renderOperationMarkdown(operation), "");
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

function renderOperationMarkdown(op: OperationRefDoc, headingLevel: number = 3) {
  const content = [
    headings.hx(headingLevel, `${inlinecode(op.name)} {#${op.id}}`),
    "",
    op.doc,
    codeblock(op.signature, "cadl"),
    "",
  ];

  if (op.templateParameters) {
    content.push(renderTemplateParametersTable(op.templateParameters, headingLevel + 1));
  }

  return content.join("\n");
}

function renderTemplateParametersTable(
  templateParameters: TemplateParameterRefDoc[],
  headingLevel: number
) {
  const paramTable: string[][] = [["Name", "Description"]];
  for (const param of templateParameters) {
    paramTable.push([param.name, param.doc]);
  }

  return [headings.hx(headingLevel, "Template Parameters"), table(paramTable), ""].join("\n");
}

function renderInterfaceMarkdown(iface: InterfaceRefDoc, headingLevel: number = 3) {
  const content = [
    headings.hx(headingLevel, `${inlinecode(iface.name)} {#${iface.id}}`),
    "",
    iface.doc,
    codeblock(iface.signature, "cadl"),
    "",
  ];

  if (iface.templateParameters) {
    content.push(renderTemplateParametersTable(iface.templateParameters, headingLevel + 1));
  }

  return content.join("\n");
}
