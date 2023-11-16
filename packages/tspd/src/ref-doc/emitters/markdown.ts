import { resolvePath } from "@typespec/compiler";
import { readFile } from "fs/promises";
import { stringify } from "yaml";
import {
  DecoratorRefDoc,
  EmitterOptionRefDoc,
  EnumRefDoc,
  ExampleRefDoc,
  InterfaceRefDoc,
  LinterRuleRefDoc,
  ModelRefDoc,
  NamedTypeRefDoc,
  NamespaceRefDoc,
  OperationRefDoc,
  ReferencableElement,
  ScalarRefDoc,
  TemplateParameterRefDoc,
  TypeSpecRefDoc,
  TypeSpecRefDocBase,
  UnionRefDoc,
} from "../types.js";
import {
  MarkdownDoc,
  codeblock,
  inlinecode,
  link,
  renderMarkdowDoc,
  section,
  table,
} from "../utils/markdown.js";
import { getTypeSignature } from "../utils/type-signature.js";

async function loadTemplate(projectRoot: string, name: string) {
  try {
    const content = await readFile(resolvePath(projectRoot, `.tspd/docs/${name}.md`));
    return content.toString();
  } catch (e) {
    if (typeof e === "object" && (e as any)?.code === "ENOENT") {
      return undefined;
    }
    throw e;
  }
}

export async function renderReadme(refDoc: TypeSpecRefDoc, projectRoot: string) {
  const content: MarkdownDoc[] = [];
  const renderer = new MarkdownRenderer();

  if (refDoc.description) {
    content.push(refDoc.description);
  }

  content.push(renderer.install(refDoc));

  const usageTemplate = await loadTemplate(projectRoot, "usage");
  if (usageTemplate) {
    content.push(section("Usage", [usageTemplate]));
  }
  if (refDoc.emitter?.options) {
    content.push(renderer.emitterUsage(refDoc));
  }

  if (refDoc.linter) {
    content.push(renderer.linterUsage(refDoc));
  }

  if (refDoc.namespaces.some((x) => x.decorators.length > 0)) {
    content.push(section("Decorators", renderer.decoratorsSection(refDoc, { includeToc: true })));
  }

  return renderMarkdowDoc(section(refDoc.name, content));
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

  anchorId(item: ReferencableElement): string {
    return `${item.name.toLowerCase().replace(/ /g, "-")}`;
  }

  //#region TypeSpec types
  operation(op: OperationRefDoc) {
    const content: MarkdownDoc = ["", op.doc, codeblock(op.signature, "typespec"), ""];

    if (op.templateParameters) {
      content.push(this.templateParameters(op.templateParameters));
    }

    content.push(this.examples(op.examples));

    return section(this.headingTitle(op), content);
  }

  interface(iface: InterfaceRefDoc) {
    const content: MarkdownDoc = ["", iface.doc, codeblock(iface.signature, "typespec"), ""];

    if (iface.templateParameters) {
      content.push(this.templateParameters(iface.templateParameters));
    }

    if (iface.interfaceOperations.length > 0) {
      for (const op of iface.interfaceOperations) {
        content.push(this.operation(op));
      }
    }

    content.push(this.examples(iface.examples));

    return section(this.headingTitle(iface), content);
  }

  model(model: ModelRefDoc) {
    const content: MarkdownDoc = ["", model.doc, codeblock(model.signature, "typespec"), ""];

    if (model.templateParameters) {
      content.push(this.templateParameters(model.templateParameters));
    }

    content.push(this.examples(model.examples));

    return section(this.headingTitle(model), content);
  }

  enum(e: EnumRefDoc): MarkdownDoc {
    const content: MarkdownDoc = [
      "",
      e.doc,
      codeblock(e.signature, "typespec"),
      "",
      this.examples(e.examples),
    ];

    return section(this.headingTitle(e), content);
  }

  union(union: UnionRefDoc): MarkdownDoc {
    const content: MarkdownDoc = ["", union.doc, codeblock(union.signature, "typespec"), ""];

    if (union.templateParameters) {
      content.push(this.templateParameters(union.templateParameters));
    }

    content.push(this.examples(union.examples));

    return section(this.headingTitle(union), content);
  }

  scalar(scalar: ScalarRefDoc): MarkdownDoc {
    const content: MarkdownDoc = ["", scalar.doc, codeblock(scalar.signature, "typespec"), ""];

    if (scalar.templateParameters) {
      content.push(this.templateParameters(scalar.templateParameters));
    }

    content.push(this.examples(scalar.examples));

    return section(this.headingTitle(scalar), content);
  }

  templateParameters(templateParameters: TemplateParameterRefDoc[]): MarkdownDoc {
    const paramTable: string[][] = [["Name", "Description"]];
    for (const param of templateParameters) {
      paramTable.push([param.name, param.doc]);
    }

    return section("Template Parameters", [table(paramTable), ""]);
  }

  decorator(dec: DecoratorRefDoc) {
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

    content.push(this.examples(dec.examples));

    return section(this.headingTitle(dec), content);
  }

  examples(examples: ExampleRefDoc[]) {
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
  // #endregion TypeSpec types

  /** Render all decorators */
  decoratorsSection(
    refDoc: TypeSpecRefDocBase,
    options: { includeToc?: boolean } = {}
  ): MarkdownDoc {
    return groupByNamespace(refDoc.namespaces, (namespace) => {
      if (namespace.decorators.length === 0) {
        return undefined;
      }
      return [
        options.includeToc ? this.toc(namespace.decorators) : [],
        namespace.decorators.map((x) => [this.decorator(x), ""]),
      ];
    });
  }

  toc(items: ReferencableElement[], filename?: string) {
    return items.map(
      (item) => ` - [${inlinecode(item.name)}](${filename ?? ""}#${this.anchorId(item)})`
    );
  }

  install(refDoc: TypeSpecRefDoc) {
    return section("Install", [codeblock(`npm install ${refDoc.name}`, "bash")]);
  }

  emitterUsage(refDoc: TypeSpecRefDoc) {
    if (refDoc.emitter?.options === undefined) {
      return [];
    }

    return section("Emitter", [
      section("Usage", [
        "1. Via the command line",
        codeblock(`tsp compile . --emit=${refDoc.name}`, "bash"),
        "2. Via the config",
        codeblock(`emit:\n  - "${refDoc.name}" `, "yaml"),
      ]),
      this.emitterOptions(refDoc.emitter.options),
    ]);
  }

  emitterOptions(options: EmitterOptionRefDoc[]) {
    const content = [];
    for (const option of options) {
      content.push(
        section(`${inlinecode(option.name)}`, [`**Type:** ${inlinecode(option.type)}`, ""])
      );

      content.push(option.doc);
    }
    return section("Emitter options", content);
  }

  linterUsage(refDoc: TypeSpecRefDoc) {
    if (refDoc.linter === undefined) {
      return [];
    }
    const setupExample = stringify({
      linter: refDoc.linter.ruleSets
        ? { extends: [refDoc.linter.ruleSets[0].name] }
        : { rules: {} },
    });
    return section("Linter", [
      section("Usage", ["Add the following in `tspconfig.yaml`:", codeblock(setupExample, "yaml")]),
      refDoc.linter.ruleSets
        ? section("RuleSets", ["Available ruleSets:", this.toc(refDoc.linter.ruleSets)])
        : [],
      section("Rules", this.linterRuleToc(refDoc.linter.rules)),
    ]);
  }

  linterRuleToc(rules: LinterRuleRefDoc[]) {
    return table([
      ["Name", "Description"],
      ...rules.map((rule) => {
        const name = inlinecode(rule.name);
        const nameCell = rule.rule.url ? link(name, this.linterRuleLink(rule.rule.url)) : name;
        return [nameCell, rule.rule.description];
      }),
    ]);
  }

  linterRuleLink(url: string) {
    return url;
  }
}
