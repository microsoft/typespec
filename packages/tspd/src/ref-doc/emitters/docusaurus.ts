import prettier from "prettier";
import {
  EmitterOptionRefDoc,
  EnumRefDoc,
  InterfaceRefDoc,
  ModelRefDoc,
  NamedTypeRefDoc,
  OperationRefDoc,
  ScalarRefDoc,
  TemplateParameterRefDoc,
  TypeSpecLibraryRefDoc,
  TypeSpecRefDoc,
  TypeSpecRefDocBase,
  UnionRefDoc,
} from "../types.js";
import {
  MarkdownDoc,
  codeblock,
  headings,
  inlinecode,
  renderMarkdowDoc,
  section,
  table,
  tabs,
} from "../utils/markdown.js";
import {
  MarkdownRenderer,
  groupByNamespace,
  renderDecoratorSection,
  renderEmitterUsage,
  renderExamples,
} from "./markdown.js";

/**
 * Render doc to a markdown using docusaurus addons.
 */
export function renderToDocusaurusMarkdown(refDoc: TypeSpecRefDoc): Record<string, string> {
  const renderer = new DocusaurusRenderer();
  const files: Record<string, string> = {
    "index.md": renderIndexFile(refDoc),
  };

  const decoratorFile = renderDecoratorFile(renderer, refDoc);
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

function renderIndexFile(refDoc: TypeSpecLibraryRefDoc): string {
  const content: MarkdownDoc = [
    "---",
    `title: Overview`,
    `sidebar_position: 0`,
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
    "---",
    "import Tabs from '@theme/Tabs';",
    "import TabItem from '@theme/TabItem';",
    "",
  ];

  if (refDoc.description) {
    content.push(refDoc.description);
  }
  content.push(headings.h2("Install"));
  content.push(
    tabs([
      { id: "spec", label: "In a spec", content: codeblock(`npm install ${refDoc.name}`, "bash") },
      {
        id: "library",
        label: "In a library",
        content: codeblock(`npm install --save-peer ${refDoc.name}`, "bash"),
      },
    ])
  );

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
  return renderMarkdowDoc(content);
}

export type DecoratorRenderOptions = {
  title?: string;
};
export function renderDecoratorFile(
  renderer: DocusaurusRenderer,
  refDoc: TypeSpecRefDocBase,
  options?: DecoratorRenderOptions
): string | undefined {
  if (!refDoc.namespaces.some((x) => x.decorators.length > 0)) {
    return undefined;
  }
  const title = options?.title ?? "Decorators";
  const content: MarkdownDoc = [
    "---",
    `title: "${title}"`,
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
    "---",
  ];

  content.push(section(title, renderDecoratorSection(renderer, refDoc)));

  return renderMarkdowDoc(content);
}

function renderInterfacesFile(refDoc: TypeSpecRefDoc): string | undefined {
  if (!refDoc.namespaces.some((x) => x.operations.length > 0 || x.interfaces.length > 0)) {
    return undefined;
  }
  const content: MarkdownDoc = [
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

      const content: MarkdownDoc = [];
      for (const iface of namespace.interfaces) {
        content.push(renderInterfaceMarkdown(iface), "");
      }

      for (const operation of namespace.operations) {
        content.push(renderOperationMarkdown(operation), "");
      }
      return renderMarkdowDoc(content);
    })
  );

  return renderMarkdowDoc(content);
}

function renderOperationMarkdown(op: OperationRefDoc, headingLevel: number = 3) {
  const content: MarkdownDoc = [
    headings.hx(headingLevel, `${inlinecode(op.name)} {#${op.id}}`),
    "",
    op.doc,
    codeblock(op.signature, "typespec"),
    "",
  ];

  if (op.templateParameters) {
    content.push(renderTemplateParametersTable(op.templateParameters));
  }

  content.push(renderExamples(op.examples));

  return renderMarkdowDoc(content);
}

function renderTemplateParametersTable(templateParameters: TemplateParameterRefDoc[]): MarkdownDoc {
  const paramTable: string[][] = [["Name", "Description"]];
  for (const param of templateParameters) {
    paramTable.push([param.name, param.doc]);
  }

  return section("Template Parameters", [table(paramTable), ""]);
}

function renderInterfaceMarkdown(iface: InterfaceRefDoc, headingLevel: number = 3) {
  const content: MarkdownDoc = [
    headings.hx(headingLevel, `${inlinecode(iface.name)} {#${iface.id}}`),
    "",
    iface.doc,
    codeblock(iface.signature, "typespec"),
    "",
  ];

  if (iface.templateParameters) {
    content.push(renderTemplateParametersTable(iface.templateParameters));
  }

  if (iface.interfaceOperations.length > 0) {
    for (const op of iface.interfaceOperations) {
      content.push(renderOperationMarkdown(op));
    }
  }

  content.push(renderExamples(iface.examples));

  return renderMarkdowDoc(content);
}

function renderDataTypes(refDoc: TypeSpecRefDoc): string | undefined {
  if (!refDoc.namespaces.some((x) => x.models.length > 0)) {
    return undefined;
  }
  const content: MarkdownDoc = [
    "---",
    `title: "Data types"`,
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
    "---",
  ];

  content.push(
    section(
      "Data types",
      groupByNamespace(refDoc.namespaces, (namespace) => {
        const modelCount =
          namespace.models.length +
          namespace.enums.length +
          namespace.unions.length +
          namespace.scalars.length;
        if (modelCount === 0) {
          return undefined;
        }
        const content: MarkdownDoc = [];
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
        return renderMarkdowDoc(content);
      })
    )
  );

  return renderMarkdowDoc(content);
}

function renderModel(model: ModelRefDoc, headingLevel: number = 3): string {
  const content: MarkdownDoc = [
    headings.hx(headingLevel, `${inlinecode(model.name)} {#${model.id}}`),
    "",
    model.doc,
    codeblock(model.signature, "typespec"),
    "",
  ];

  if (model.templateParameters) {
    content.push(renderTemplateParametersTable(model.templateParameters));
  }

  content.push(renderExamples(model.examples));

  return renderMarkdowDoc(content);
}

function renderEnum(e: EnumRefDoc, headingLevel: number = 3): string {
  const content: MarkdownDoc = [
    headings.hx(headingLevel, `${inlinecode(e.name)} {#${e.id}}`),
    "",
    e.doc,
    codeblock(e.signature, "typespec"),
    "",
    renderExamples(e.examples),
  ];

  return renderMarkdowDoc(content);
}

function renderUnion(union: UnionRefDoc, headingLevel: number = 3): string {
  const content: MarkdownDoc = [
    headings.hx(headingLevel, `${inlinecode(union.name)} {#${union.id}}`),
    "",
    union.doc,
    codeblock(union.signature, "typespec"),
    "",
  ];

  if (union.templateParameters) {
    content.push(renderTemplateParametersTable(union.templateParameters));
  }

  content.push(renderExamples(union.examples));

  return renderMarkdowDoc(content);
}

function renderScalar(scalar: ScalarRefDoc, headingLevel: number = 3): string {
  const content: MarkdownDoc = [
    headings.hx(headingLevel, `${inlinecode(scalar.name)} {#${scalar.id}}`),
    "",
    scalar.doc,
    codeblock(scalar.signature, "typespec"),
    "",
  ];

  if (scalar.templateParameters) {
    content.push(renderTemplateParametersTable(scalar.templateParameters));
  }

  content.push(renderExamples(scalar.examples));

  return renderMarkdowDoc(content);
}

function renderEmitter(refDoc: TypeSpecLibraryRefDoc): string | undefined {
  if (refDoc.emitter?.options === undefined) {
    return undefined;
  }
  const content: MarkdownDoc = [
    "---",
    `title: "Emitter usage"`,
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
    "---",
    renderMarkdowDoc(renderEmitterUsage(refDoc)),
  ];

  content.push(headings.h2("Usage"));
  content.push("1. Via the command line");
  content.push(codeblock(`tsp compile . --emit=${refDoc.name}`, "bash"));
  content.push("2. Via the config");
  content.push(codeblock(`emit:\n  - "${refDoc.name}" `, "yaml"));

  content.push(renderEmitterOptions(refDoc.emitter.options));

  return renderMarkdowDoc(content);
}

function renderEmitterOptions(options: EmitterOptionRefDoc[]): string {
  const content: MarkdownDoc = [headings.h2("Emitter options")];
  for (const option of options) {
    content.push(headings.h3(`${inlinecode(option.name)}`));
    content.push(`**Type:** ${inlinecode(option.type)}`, "");

    content.push(option.doc);
  }
  return renderMarkdowDoc(content);
}

export class DocusaurusRenderer extends MarkdownRenderer {
  headingTitle(item: NamedTypeRefDoc): string {
    // Set an explicit anchor id.
    return `${inlinecode(item.name)} {#${item.id}}`;
  }
  anchorId(item: NamedTypeRefDoc): string {
    // Set an explicit anchor id.
    return item.id;
  }
}
