import {
  DecoratorRefDoc,
  EmitterOptionRefDoc,
  EnumRefDoc,
  ExampleRefDoc,
  InterfaceRefDoc,
  ModelRefDoc,
  NamedTypeRefDoc,
  NamespaceRefDoc,
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
  inlinecode,
  renderMarkdowDoc,
  section,
  table,
} from "../utils/markdown.js";
import { getTypeSignature } from "../utils/type-signature.js";

export function renderReadme(refDoc: TypeSpecRefDoc) {
  const content: MarkdownDoc[] = [];
  const renderer = new MarkdownRenderer();

  if (refDoc.description) {
    content.push(refDoc.description);
  }

  content.push(section("Install", [codeblock(`npm install ${refDoc.name}`, "bash")]));

  if (refDoc.emitter?.options) {
    content.push(renderEmitterUsage(refDoc));
  }

  if (refDoc.namespaces.some((x) => x.decorators.length > 0)) {
    content.push(
      section("Decorators", renderDecoratorSection(renderer, refDoc, { includeToc: true }))
    );
  }

  return renderMarkdowDoc(section(refDoc.name, content));
}

export function renderEmitterUsage(refDoc: TypeSpecLibraryRefDoc): MarkdownDoc {
  if (refDoc.emitter?.options === undefined) {
    return [];
  }

  return section("Emitter usage", [
    section("Usage", [
      "1. Via the command line",
      codeblock(`tsp compile . --emit=${refDoc.name}`, "bash"),
      "2. Via the config",
      codeblock(`emit:\n  - "${refDoc.name}" `, "yaml"),
    ]),
    renderEmitterOptions(refDoc.emitter.options),
  ]);
}

function renderEmitterOptions(options: EmitterOptionRefDoc[]): MarkdownDoc {
  const content = [];
  for (const option of options) {
    content.push(
      section(`${inlinecode(option.name)}`, [`**Type:** ${inlinecode(option.type)}`, ""])
    );

    content.push(option.doc);
  }
  return section("Emitter options", content);
}

export function renderDecoratorSection(
  renderer: MarkdownRenderer,
  refDoc: TypeSpecRefDocBase,
  options: { includeToc?: boolean } = {}
): MarkdownDoc {
  return groupByNamespace(refDoc.namespaces, (namespace) => {
    if (namespace.decorators.length === 0) {
      return undefined;
    }
    return [
      options.includeToc ? renderer.decoratorToc(namespace) : [],
      namespace.decorators.map((x) => [renderDecoratorMarkdown(renderer, x), ""]),
    ];
  });
}

function renderDecoratorMarkdown(renderer: MarkdownRenderer, dec: DecoratorRefDoc): MarkdownDoc {
  const content: MarkdownDoc = ["", dec.doc, codeblock(dec.signature, "typespec"), ""];

  content.push(
    section("Target", [dec.target.doc, inlinecode(getTypeSignature(dec.target.type.type)), ""])
  );

  if (dec.parameters.length > 0) {
    const paramTable: string[][] = [["Name", "Type", "Description"]];
    for (const param of dec.parameters) {
      paramTable.push([param.name, inlinecode(getTypeSignature(param.type.type)), param.doc]);
    }
    content.push(section("Parameters", [table(paramTable), ""]));
  } else {
    content.push(section("Parameters", ["None", ""]));
  }

  content.push(renderExamples(dec.examples));

  return section(renderer.headingTitle(dec), content);
}

export function renderExamples(examples: ExampleRefDoc[]): MarkdownDoc {
  const content: MarkdownDoc = [];
  if (examples.length === 0) {
    return "";
  }

  for (const example of examples) {
    const exampleContent = ["", example.content, ""];
    if (example.title) {
      content.push(section(example.title, exampleContent));
    } else {
      content.push(exampleContent);
    }
  }
  return section("Examples", content);
}

export function groupByNamespace(
  namespaces: NamespaceRefDoc[],
  callback: (namespace: NamespaceRefDoc) => MarkdownDoc | undefined
): MarkdownDoc {
  const content: MarkdownDoc = [];
  for (const namespace of namespaces) {
    const contentForNamespace = callback(namespace);
    if (contentForNamespace) {
      content.push(section(namespace.id, contentForNamespace));
    }
  }
  return content;
}

/**
 * Github flavored markdown renderer.
 */
export class MarkdownRenderer {
  headingTitle(item: NamedTypeRefDoc): string {
    return inlinecode(item.name);
  }

  anchorId(item: NamedTypeRefDoc): string {
    return `${item.name.toLowerCase().replace(/ /g, "-")}`;
  }

  operation(op: OperationRefDoc) {
    const content: MarkdownDoc = ["", op.doc, codeblock(op.signature, "typespec"), ""];

    if (op.templateParameters) {
      content.push(this.renderTemplateParametersTable(op.templateParameters));
    }

    content.push(renderExamples(op.examples));

    return section(this.headingTitle(op), content);
  }

  interface(iface: InterfaceRefDoc) {
    const content: MarkdownDoc = ["", iface.doc, codeblock(iface.signature, "typespec"), ""];

    if (iface.templateParameters) {
      content.push(this.renderTemplateParametersTable(iface.templateParameters));
    }

    if (iface.interfaceOperations.length > 0) {
      for (const op of iface.interfaceOperations) {
        content.push(this.operation(op));
      }
    }

    content.push(renderExamples(iface.examples));

    return section(this.headingTitle(iface), content);
  }

  model(model: ModelRefDoc) {
    const content: MarkdownDoc = ["", model.doc, codeblock(model.signature, "typespec"), ""];

    if (model.templateParameters) {
      content.push(this.renderTemplateParametersTable(model.templateParameters));
    }

    content.push(renderExamples(model.examples));

    return section(this.headingTitle(model), content);
  }

  enum(e: EnumRefDoc): MarkdownDoc {
    const content: MarkdownDoc = [
      "",
      e.doc,
      codeblock(e.signature, "typespec"),
      "",
      renderExamples(e.examples),
    ];

    return section(this.headingTitle(e), content);
  }

  union(union: UnionRefDoc): MarkdownDoc {
    const content: MarkdownDoc = ["", union.doc, codeblock(union.signature, "typespec"), ""];

    if (union.templateParameters) {
      content.push(this.renderTemplateParametersTable(union.templateParameters));
    }

    content.push(renderExamples(union.examples));

    return section(this.headingTitle(union), content);
  }

  scalar(scalar: ScalarRefDoc): MarkdownDoc {
    const content: MarkdownDoc = ["", scalar.doc, codeblock(scalar.signature, "typespec"), ""];

    if (scalar.templateParameters) {
      content.push(this.renderTemplateParametersTable(scalar.templateParameters));
    }

    content.push(renderExamples(scalar.examples));

    return section(this.headingTitle(scalar), content);
  }

  renderTemplateParametersTable(templateParameters: TemplateParameterRefDoc[]): MarkdownDoc {
    const paramTable: string[][] = [["Name", "Description"]];
    for (const param of templateParameters) {
      paramTable.push([param.name, param.doc]);
    }

    return section("Template Parameters", [table(paramTable), ""]);
  }

  decoratorToc(namespace: NamespaceRefDoc) {
    const listContent = [];
    for (const decorator of namespace.decorators) {
      listContent.push(` - [${inlinecode(decorator.name)}](#${this.anchorId(decorator)})`);
    }
    return listContent;
  }
}
