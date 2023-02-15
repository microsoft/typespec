import prettier from "prettier";
import {
  DecoratorRefDoc,
  EnumRefDoc,
  InterfaceRefDoc,
  ModelRefDoc,
  NamespaceRefDoc,
  OperationRefDoc,
  TemplateParameterRefDoc,
  TypeSpecRefDoc,
  UnionRefDoc,
} from "../types.js";
import { codeblock, headings, inlinecode, table } from "../utils/markdown.js";
import { getTypeSignature } from "../utils/type-signature.js";

/**
 * Render doc to a markdown using docusaurus addons.
 */
export function renderToDocusaurusMarkdown(refDoc: TypeSpecRefDoc): Record<string, string> {
  const files: Record<string, string> = {
    "index.md": renderIndexFile(refDoc),
  };

  const decoratorFile = renderDecoratorFile(refDoc);
  if (decoratorFile) {
    files["decorators.md"] = decoratorFile;
  }

  const interfaceFile = renderInterfacesFile(refDoc);
  if (interfaceFile) {
    files["interfaces.md"] = interfaceFile;
  }

  const dataTypes = renderDataTypes(refDoc);
  if (dataTypes) {
    files["data-types.md"] = dataTypes;
  }

  for (const [file, content] of Object.entries(files)) {
    try {
      files[file] = prettier.format(content, {
        parser: "markdown",
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Cannot format with prettier ${file}`);
    }
  }
  return files;
}

function renderIndexFile(refDoc: TypeSpecRefDoc): string {
  const content = [
    "---",
    `title: Index`,
    `sidebar_position: 0`,
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
    "---",
  ];

  for (const namespace of refDoc.namespaces) {
    content.push(headings.h2(namespace.id), "");
    if (namespace.decorators.length > 0) {
      content.push(headings.h3("Decorators"), "");
      for (const decorator of namespace.decorators) {
        content.push(` - [${inlinecode(decorator.name)}](./decorators.md#${decorator.id})`);
      }
    }

    if (namespace.interfaces.length > 0) {
      content.push(headings.h3("Interfaces"), "");
      for (const iface of namespace.interfaces) {
        content.push(` - [${inlinecode(iface.name)}](./interfaces.md#${iface.id})`);
      }
    }

    if (namespace.operations.length > 0) {
      content.push(headings.h3("Operations"), "");
      for (const operation of namespace.operations) {
        content.push(` - [${inlinecode(operation.name)}](./interfaces.md#${operation.id})`);
      }
    }

    if (namespace.models.length > 0) {
      content.push(headings.h3("Models"), "");
      for (const model of namespace.models) {
        content.push(` - [${inlinecode(model.name)}](./data-types.md#${model.id})`);
      }
    }
  }
  return content.join("\n");
}

function renderDecoratorFile(refDoc: TypeSpecRefDoc): string | undefined {
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

  content.push(
    groupByNamespace(refDoc.namespaces, (namespace) => {
      if (namespace.decorators.length === 0) {
        return undefined;
      }

      const content = [];
      for (const dec of namespace.decorators) {
        content.push(renderDecoratorMarkdown(dec), "");
      }
      return content.join("\n");
    })
  );

  return content.join("\n");
}

function renderDecoratorMarkdown(dec: DecoratorRefDoc, headingLevel: number = 3): string {
  const content = [
    headings.hx(headingLevel, `${inlinecode(dec.name)} {#${dec.id}}`),
    "",
    dec.doc,
    codeblock(dec.signature, "typespec"),
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

function renderInterfacesFile(refDoc: TypeSpecRefDoc): string | undefined {
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

  content.push(
    groupByNamespace(refDoc.namespaces, (namespace) => {
      if (namespace.operations.length === 0 && namespace.interfaces.length === 0) {
        return undefined;
      }

      const content = [];
      for (const iface of namespace.interfaces) {
        content.push(renderInterfaceMarkdown(iface), "");
      }

      for (const operation of namespace.operations) {
        content.push(renderOperationMarkdown(operation), "");
      }
      return content.join("\n");
    })
  );

  return content.join("\n");
}

function renderOperationMarkdown(op: OperationRefDoc, headingLevel: number = 3) {
  const content = [
    headings.hx(headingLevel, `${inlinecode(op.name)} {#${op.id}}`),
    "",
    op.doc,
    codeblock(op.signature, "typespec"),
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
    codeblock(iface.signature, "typespec"),
    "",
  ];

  if (iface.templateParameters) {
    content.push(renderTemplateParametersTable(iface.templateParameters, headingLevel + 1));
  }

  return content.join("\n");
}

function renderDataTypes(refDoc: TypeSpecRefDoc): string | undefined {
  if (!refDoc.namespaces.some((x) => x.models.length > 0)) {
    return undefined;
  }
  const content = [
    "---",
    `title: "Data types"`,
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
    "---",
    headings.h1("Data types"),
  ];

  content.push(
    groupByNamespace(refDoc.namespaces, (namespace) => {
      if (namespace.models.length === 0) {
        return undefined;
      }
      const content = [];
      for (const model of namespace.models) {
        content.push(renderModel(model), "");
      }
      for (const e of namespace.enums) {
        content.push(renderEnum(e), "");
      }
      for (const union of namespace.unions) {
        content.push(renderUnion(union), "");
      }
      return content.join("\n");
    })
  );

  return content.join("\n");
}

function renderModel(model: ModelRefDoc, headingLevel: number = 3): string {
  const content = [
    headings.hx(headingLevel, `${inlinecode(model.name)} {#${model.id}}`),
    "",
    model.doc,
    codeblock(model.signature, "typespec"),
    "",
  ];

  if (model.templateParameters) {
    content.push(renderTemplateParametersTable(model.templateParameters, headingLevel + 1));
  }

  return content.join("\n");
}

function renderEnum(e: EnumRefDoc, headingLevel: number = 3): string {
  const content = [
    headings.hx(headingLevel, `${inlinecode(e.name)} {#${e.id}}`),
    "",
    e.doc,
    codeblock(e.signature, "typespec"),
    "",
  ];

  return content.join("\n");
}
function renderUnion(union: UnionRefDoc, headingLevel: number = 3): string {
  const content = [
    headings.hx(headingLevel, `${inlinecode(union.name)} {#${union.id}}`),
    "",
    union.doc,
    codeblock(union.signature, "typespec"),
    "",
  ];

  if (union.templateParameters) {
    content.push(renderTemplateParametersTable(union.templateParameters, headingLevel + 1));
  }

  return content.join("\n");
}

function groupByNamespace(
  namespaces: NamespaceRefDoc[],
  callback: (namespace: NamespaceRefDoc) => string | undefined
): string {
  const content = [];
  for (const namespace of namespaces) {
    const contentForNamespace = callback(namespace);
    if (contentForNamespace) {
      content.push(headings.h2(namespace.id), "");
      content.push(contentForNamespace, "");
    }
  }
  return content.join("\n");
}
