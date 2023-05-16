import prettier from "prettier";
import {
  DecoratorRefDoc,
  EmitterOptionRefDoc,
  EnumRefDoc,
  InterfaceRefDoc,
  ModelRefDoc,
  NamespaceRefDoc,
  OperationRefDoc,
  ScalarRefDoc,
  TemplateParameterRefDoc,
  TypeSpecLibraryRefDoc,
  TypeSpecRefDoc,
  TypeSpecRefDocBase,
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

  const emitter = renderEmitter(refDoc);
  if (emitter) {
    files["emitter.md"] = emitter;
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

  if (refDoc.emitter?.options) {
    content.push(headings.h3("Emitter usage"), "");
    content.push(`[See documentation](./emitter.md)`);
  }

  for (const namespace of refDoc.namespaces) {
    content.push(headings.h2(namespace.id), "");

    if (namespace.decorators.length > 0) {
      content.push(headings.h3("Decorators"), "");
      const listContent = [];
      for (const decorator of namespace.decorators) {
        listContent.push(` - [${inlinecode(decorator.name)}](./decorators.md#${decorator.id})`);
      }
      content.push(...listContent);
    }

    if (namespace.interfaces.length > 0) {
      content.push(headings.h3("Interfaces"), "");
      const listContent = [];
      for (const iface of namespace.interfaces) {
        listContent.push(` - [${inlinecode(iface.name)}](./interfaces.md#${iface.id})`);
      }
      content.push(...listContent);
    }

    if (namespace.operations.length > 0) {
      content.push(headings.h3("Operations"), "");
      const listContent = [];
      for (const operation of namespace.operations) {
        listContent.push(` - [${inlinecode(operation.name)}](./interfaces.md#${operation.id})`);
      }
      content.push(...listContent);
    }

    if (namespace.models.length > 0) {
      content.push(headings.h3("Models"), "");
      const listContent = [];
      for (const model of namespace.models) {
        listContent.push(` - [${inlinecode(model.name)}](./data-types.md#${model.id})`);
      }
      content.push(...listContent);
    }
  }
  return content.join("\n");
}

export type DecoratorRenderOptions = {
  title?: string;
};
export function renderDecoratorFile(
  refDoc: TypeSpecRefDocBase,
  options?: DecoratorRenderOptions
): string | undefined {
  if (!refDoc.namespaces.some((x) => x.decorators.length > 0)) {
    return undefined;
  }
  const title = options?.title ?? "Decorators";
  const content = [
    "---",
    `title: "${title}"`,
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
    "---",
    headings.h1(title),
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

  if (dec.parameters.length > 0) {
    const paramTable: string[][] = [["Name", "Type", "Description"]];
    for (const param of dec.parameters) {
      paramTable.push([param.name, inlinecode(getTypeSignature(param.type.type)), param.doc]);
    }
    content.push(headings.hx(headingLevel + 1, "Parameters"), table(paramTable), "");
  } else {
    content.push(headings.hx(headingLevel + 1, "Parameters"), "None", "");
  }

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

  if (iface.interfaceOperations.length > 0) {
    for (const op of iface.interfaceOperations) {
      content.push(renderOperationMarkdown(op, headingLevel + 1));
    }
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
      const modelCount =
        namespace.models.length +
        namespace.enums.length +
        namespace.unions.length +
        namespace.scalars.length;
      if (modelCount === 0) {
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
      for (const scalar of namespace.scalars) {
        content.push(renderScalar(scalar), "");
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

function renderScalar(scalar: ScalarRefDoc, headingLevel: number = 3): string {
  const content = [
    headings.hx(headingLevel, `${inlinecode(scalar.name)} {#${scalar.id}}`),
    "",
    scalar.doc,
    codeblock(scalar.signature, "typespec"),
    "",
  ];

  if (scalar.templateParameters) {
    content.push(renderTemplateParametersTable(scalar.templateParameters, headingLevel + 1));
  }

  return content.join("\n");
}

function renderEmitter(refDoc: TypeSpecLibraryRefDoc): string | undefined {
  if (refDoc.emitter?.options === undefined) {
    return undefined;
  }
  const content = [
    "---",
    `title: "Emitter usage"`,
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
    "---",
    headings.h1("Emitter usage"),
  ];

  content.push(headings.h2("Usage"));
  content.push(codeblock(`tsp compile . --emit=${refDoc.name}`, "bash"));

  content.push(renderEmitterOptions(refDoc.emitter.options));

  return content.join("\n");
}

function renderEmitterOptions(options: EmitterOptionRefDoc[]): string {
  const content = [headings.h2("Emitter options")];
  for (const option of options) {
    content.push(headings.h3(`${inlinecode(option.name)}`));
    content.push(`**Type:** ${inlinecode(option.type)}`, "");

    content.push(option.doc);
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
