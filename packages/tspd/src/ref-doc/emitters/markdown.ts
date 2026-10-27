import type { Entity, MixedParameterConstraint } from "@typespec/compiler";
import { getEntityName, isType, resolvePath } from "@typespec/compiler";
import { readFile } from "fs/promises";
import { stringify } from "yaml";
import type {
  DecoratorRefDoc,
  DeprecationNotice,
  EmitterOptionRefDoc,
  EmitterOptionVariantRefDoc,
  EnumRefDoc,
  ExampleRefDoc,
  InterfaceRefDoc,
  LinterRuleRefDoc,
  ModelPropertyRefDoc,
  ModelRefDoc,
  NamedTypeRefDoc,
  NamespaceRefDoc,
  OperationRefDoc,
  RefDocEntity,
  ReferencableElement,
  ScalarRefDoc,
  TemplateParameterRefDoc,
  TypeSpecRefDoc,
  TypeSpecRefDocBase,
  UnionRefDoc,
} from "../types.js";
import type { MarkdownDoc } from "../utils/markdown.js";
import {
  codeblock,
  inlinecode,
  link,
  renderMarkdowDoc,
  section,
  table,
} from "../utils/markdown.js";

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
  const renderer = new MarkdownRenderer(refDoc);
  const headerTemplate = await loadTemplate(projectRoot, "header");
  if (headerTemplate) {
    content.push(headerTemplate);
  }
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

  const footerTemplate = await loadTemplate(projectRoot, "footer");
  if (footerTemplate) {
    content.push(footerTemplate);
  }

  return renderMarkdowDoc(section(refDoc.name, content));
}

export function groupByNamespace(
  namespaces: readonly NamespaceRefDoc[],
  callback: (namespace: NamespaceRefDoc) => MarkdownDoc | undefined,
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
 * Builds composable Markdown fragments from reference records without writing files.
 * The base renderer uses same-page links. Subclasses can override heading, anchor,
 * file-selection, and notice hooks for a site's Markdown dialect.
 */
export class MarkdownRenderer {
  /** Uses this library's declaration lookup to decide which type references can become links. */
  constructor(protected readonly refDoc: TypeSpecRefDoc) {}
  /** Formats the visible declaration name as inline code, without an explicit anchor. */
  headingTitle(item: NamedTypeRefDoc): string {
    return inlinecode(item.name);
  }

  /** Derives a same-page anchor by lowercasing the display name and replacing spaces with hyphens. */
  anchorId(item: ReferencableElement): string {
    return `${item.name.toLowerCase().replace(/ /g, "-")}`;
  }

  /** Formats deprecation text as an italic notice, without adding a heading. */
  deprecationNotice(notice: DeprecationNotice): MarkdownDoc {
    return `_Deprecated: ${notice.message}_`;
  }

  /** Wraps content in a declaration heading and prepends its deprecation notice when present. */
  typeSection(type: NamedTypeRefDoc, content: MarkdownDoc) {
    const deprecated = type.deprecated ? this.deprecationNotice(type.deprecated) : [];
    return section(this.headingTitle(type), [deprecated, content]);
  }

  //#region TypeSpec types
  /** Renders an operation's description, signature, optional template table, and examples. */
  operation(op: OperationRefDoc) {
    const content: MarkdownDoc = ["", op.doc, codeblock(op.signature, "typespec"), ""];

    if (op.templateParameters) {
      content.push(this.templateParameters(op.templateParameters));
    }

    content.push(this.examples(op.examples));

    return this.typeSection(op, content);
  }

  /** Renders an interface with operation sections nested inside its declaration section. */
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

    return this.typeSection(iface, content);
  }

  /** Renders a model's declaration content followed by its properties section. */
  model(model: ModelRefDoc) {
    const content: MarkdownDoc = ["", model.doc, codeblock(model.signature, "typespec"), ""];

    if (model.templateParameters) {
      content.push(this.templateParameters(model.templateParameters));
    }

    content.push(this.examples(model.examples));
    content.push(this.modelProperties(model));
    return this.typeSection(model, content);
  }

  /**
   * Builds the properties table, appending an additional-properties row for an indexer.
   * Returns a section containing `None` when neither properties nor an indexer exist.
   */
  modelProperties(model: ModelRefDoc) {
    const content: MarkdownDoc = [];
    if (model.properties.size === 0 && model.type.indexer === undefined) {
      return section("Properties", "None");
    }
    const rows: { name: string; type: string; doc: string }[] = [
      { name: "Name", type: "Type", doc: "Description" },
    ];

    for (const prop of model.properties.values()) {
      const propRows = this.modelPropertyRows(prop);
      for (const row of propRows) {
        rows.push(row);
      }
    }
    if (model.type.indexer) {
      rows.push({
        name: "",
        type: this.ref(model.type.indexer.value),
        doc: "Additional properties",
      });
    }
    content.push(table(rows.map((x) => [x.name, x.type, x.doc])));
    return section("Properties", content);
  }

  /**
   * Builds table cells for a property, marking optional and deprecated names.
   * Anonymous model properties add one level of dotted child rows with empty descriptions.
   */
  modelPropertyRows(prop: ModelPropertyRefDoc): {
    /** Display name with optionality, deprecation markup, or a dotted child path. */
    name: string;
    /** Rendered type reference, including a link when the declaration is documented. */
    type: string;
    /** Markdown description for this row; empty for flattened child properties. */
    doc: string;
  }[] {
    const name = `${prop.name}${prop.type.optional ? "?" : ""}`;
    const base = {
      name: prop.deprecated ? `~~${name}~~ _DEPRECATED_` : name,
      type: this.ref(prop.type.type),
      doc: prop.doc,
    };
    if (prop.type.type.kind === "Model" && prop.type.type.name === "") {
      return [
        base,
        ...[...prop.type.type.properties.values()].map((x) => ({
          name: `${prop.name}.${x.name}${x.optional ? "?" : ""}`,
          type: this.ref(x.type),
          doc: "",
        })),
      ];
    }
    return [base];
  }

  /**
   * Links entities found in the library's compiler-type lookup using {@link filename} and
   * {@link anchorId}; otherwise returns an inline-code type name. Nonempty anonymous models
   * display as `{...}`. The optional prefix is part of the visible code label, not the URL.
   */
  ref(type: Entity, prefix: string = ""): string {
    const namedType = isType(type) && this.refDoc.getNamedTypeRefDoc(type);
    if (namedType) {
      return link(
        prefix + inlinecode(namedType.name),
        `${this.filename(namedType)}#${this.anchorId(namedType)}`,
      );
    }

    // So we don't show (anonymous model) until this gets improved.
    if ("kind" in type && type.kind === "Model" && type.name === "" && type.properties.size > 0) {
      return inlinecode(prefix + "{...}");
    }
    return inlinecode(
      prefix +
        getEntityName(type, {
          namespaceFilter: (ns) => !this.refDoc.namespaces.some((x) => x.name === ns.name),
        }),
    );
  }

  /** Renders an enum's declaration, member table, and examples in one section. */
  enum(e: EnumRefDoc): MarkdownDoc {
    const content: MarkdownDoc = [
      "",
      e.doc,
      codeblock(e.signature, "typespec"),
      "",
      this.enumMembers(e),
      this.examples(e.examples),
    ];

    return this.typeSection(e, content);
  }

  /** Builds the name/value/description table in member-map iteration order, without a heading. */
  enumMembers(e: EnumRefDoc): MarkdownDoc {
    const rows = [...e.members.values()].map((x) => {
      return [
        x.name,
        x.type.value
          ? inlinecode(
              typeof x.type.value === "string" ? `"${x.type.value}"` : x.type.value.toString(),
            )
          : "",
        x.doc,
      ];
    });
    return table([["Name", "Value", "Description"], ...rows]);
  }

  /** Renders a union's declaration, optional template and named-variant sections, and examples. */
  union(union: UnionRefDoc): MarkdownDoc {
    const content: MarkdownDoc = ["", union.doc, codeblock(union.signature, "typespec"), ""];

    if (union.templateParameters) {
      content.push(this.templateParameters(union.templateParameters));
    }

    if (union.variants.size > 0) {
      content.push(this.unionVariants(union));
    }

    content.push(this.examples(union.examples));

    return this.typeSection(union, content);
  }

  /** Builds a Variants section with linked value types in variant-map iteration order. */
  unionVariants(union: UnionRefDoc): MarkdownDoc {
    const rows = [...union.variants.values()].map((v) => {
      return [v.name, this.ref(v.type.type), v.doc];
    });
    return section("Variants", [table([["Name", "Type", "Description"], ...rows])]);
  }

  /** Renders scalar declaration content, including template documentation when supplied. */
  scalar(scalar: ScalarRefDoc): MarkdownDoc {
    const content: MarkdownDoc = ["", scalar.doc, codeblock(scalar.signature, "typespec"), ""];

    if (scalar.templateParameters) {
      content.push(this.templateParameters(scalar.templateParameters));
    }

    content.push(this.examples(scalar.examples));

    return this.typeSection(scalar, content);
  }

  /** Builds a Template Parameters section, preserving the supplied parameter order. */
  templateParameters(templateParameters: readonly TemplateParameterRefDoc[]): MarkdownDoc {
    const paramTable: string[][] = [["Name", "Description"]];
    for (const param of templateParameters) {
      paramTable.push([param.name, param.doc]);
    }

    return section("Template Parameters", [table(paramTable), ""]);
  }

  /** Renders the target separately from invocation parameters, followed by decorator examples. */
  decorator(dec: DecoratorRefDoc) {
    const content: MarkdownDoc = ["", dec.doc, codeblock(dec.signature, "typespec"), ""];

    content.push(section("Target", [dec.target.doc, this.ref(dec.target.type.type), ""]));

    if (dec.parameters.length > 0) {
      const paramTable: string[][] = [["Name", "Type", "Description"]];
      for (const param of dec.parameters) {
        paramTable.push([param.name, this.MixedParameterConstraint(param.type.type), param.doc]);
      }
      content.push(section("Parameters", [table(paramTable), ""]));
    } else {
      content.push(section("Parameters", ["None", ""]));
    }

    content.push(this.examples(dec.examples));

    return this.typeSection(dec, content);
  }

  /** Joins type and `valueof` alternatives with a union separator, using reference links where possible. */
  MixedParameterConstraint(constraint: MixedParameterConstraint): string {
    return [
      ...(constraint.type ? [this.ref(constraint.type)] : []),
      ...(constraint.valueType ? [this.ref(constraint.valueType, "valueof ")] : []),
    ].join(" | ");
  }

  /** Groups examples under one section, nesting titled examples; returns an empty string for none. */
  examples(examples: readonly ExampleRefDoc[]) {
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

  /** Groups all decorators by namespace, optionally inserting a linked table of contents per namespace. */
  decoratorsSection(
    refDoc: TypeSpecRefDocBase,
    options: {
      /** Include namespace-local decorator links before the declaration sections; defaults to false. */
      includeToc?: boolean;
    } = {},
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

  /** Builds Markdown list entries in input order using the same file and anchor hooks as type links. */
  toc(items: readonly (ReferencableElement & RefDocEntity)[]) {
    return items.map(
      (item) => ` - [${inlinecode(item.name)}](${this.filename(item)}#${this.anchorId(item)})`,
    );
  }

  /** Returns the link's file component; the base implementation uses an empty string for same-page links. */
  filename(type: ReferencableElement & RefDocEntity): string {
    return "";
  }

  /** Builds an Install section containing an npm command for the package name. */
  install(refDoc: TypeSpecRefDoc) {
    return section("Install", [codeblock(`npm install ${refDoc.name}`, "bash")]);
  }

  /** Builds CLI/configuration examples and emitter option sections, or no fragments when options are absent. */
  emitterUsage(refDoc: TypeSpecRefDoc) {
    if (refDoc.emitter?.options === undefined) {
      return [];
    }

    return [
      section("Emitter usage", [
        "1. Via the command line",
        codeblock(`tsp compile . --emit=${refDoc.name}`, "bash"),
        "2. Via the config",
        codeblock(`emit:\n  - "${refDoc.name}" `, "yaml"),
        "The config can be extended with options as follows:",
        codeblock(
          `emit:\n  - "${refDoc.name}"\noptions:\n  "${refDoc.name}":\n    option: value`,
          "yaml",
        ),
      ]),
      this.emitterOptions(refDoc.emitter.options),
    ];
  }

  /** Builds an Emitter options section, including the compiler's common `emitter-output-dir` option. */
  emitterOptions(options: EmitterOptionRefDoc[]) {
    const content = [];
    content.push(
      section(`${inlinecode("emitter-output-dir")}`, [
        `**Type:** ${inlinecode("absolutePath")}`,
        "",
        `Defines the emitter output directory. Defaults to \`{output-dir}/${this.refDoc.name}\``,
        `See [Configuring output directory for more info](https://typespec.io/docs/handbook/configuration/configuration/#configuring-output-directory)`,
      ]),
    );
    for (const option of options) {
      content.push(this.emitterOption(option));
    }
    return section("Emitter options", content);
  }

  /** Prefers a nonempty list of allowed literals over the type label and formats the result as code. */
  emitterOptionTypeDisplay(option: {
    /** Fallback display type when no allowed literals are provided. */
    type: string;
    /** Preformatted literals to join with a union separator. */
    allowedValues?: readonly string[];
  }): string {
    if (option.allowedValues && option.allowedValues.length > 0) {
      return inlinecode(option.allowedValues.join(" | "));
    }
    return inlinecode(option.type);
  }

  /** Renders one option with deprecation, default, alternatives, and nested-property content when present. */
  emitterOption(option: EmitterOptionRefDoc): MarkdownDoc {
    const content: MarkdownDoc = [];

    // Deprecation notice
    if (option.deprecated !== undefined) {
      const message = option.deprecated || "This option is deprecated.";
      content.push(this.deprecationNotice({ message }), "");
    }

    // Type line
    content.push(`**Type:** ${this.emitterOptionTypeDisplay(option)}`);

    // Default value
    if (option.default !== undefined) {
      content.push("", `**Default:** ${inlinecode(option.default)}`);
    }

    // Description
    if (option.doc) {
      content.push("", option.doc);
    }

    // Variants (oneOf)
    if (option.variants && option.variants.length > 0) {
      content.push("", "**Options:**", "");
      for (const variant of option.variants) {
        content.push(this.emitterOptionVariant(variant));
      }
    }

    // Nested options
    if (option.nestedOptions && option.nestedOptions.length > 0) {
      content.push("", "**Properties:**", "");
      const rows: string[][] = [["Name", "Type", "Default", "Description"]];
      for (const nested of option.nestedOptions) {
        rows.push([
          inlinecode(nested.name),
          this.emitterOptionTypeDisplay(nested),
          nested.default !== undefined ? inlinecode(nested.default) : "",
          nested.doc,
        ]);
      }
      content.push(table(rows));
    }

    return section(`${inlinecode(option.name)}`, content);
  }

  /** Renders a `oneOf` alternative as a list fragment, including its optional nested-property table. */
  emitterOptionVariant(variant: EmitterOptionVariantRefDoc): MarkdownDoc {
    const content: MarkdownDoc = [];

    // Variant type/values
    const typeDisplay = this.emitterOptionTypeDisplay(variant);

    let header = `- ${typeDisplay}`;
    if (variant.default !== undefined) {
      header += ` (default: ${inlinecode(variant.default)})`;
    }
    content.push(header);

    if (variant.doc) {
      content.push("", `  ${variant.doc}`);
    }

    // Nested options for object variants
    if (variant.nestedOptions && variant.nestedOptions.length > 0) {
      content.push("");
      const rows: string[][] = [["Name", "Type", "Default", "Description"]];
      for (const nested of variant.nestedOptions) {
        rows.push([
          inlinecode(nested.name),
          this.emitterOptionTypeDisplay(nested),
          nested.default !== undefined ? inlinecode(nested.default) : "",
          nested.doc,
        ]);
      }
      content.push("  ", table(rows));
    }

    return content;
  }

  /** Builds linter setup and rule listings, or no fragments when linter metadata is absent. */
  linterUsage(refDoc: TypeSpecRefDoc) {
    if (refDoc.linter === undefined) {
      return [];
    }
    const setupExample = stringify({
      linter: refDoc.linter.ruleSets
        ? { extends: [refDoc.linter.ruleSets[0].name] }
        : { rules: {} },
    });
    return [
      section("Usage", ["Add the following in `tspconfig.yaml`:", codeblock(setupExample, "yaml")]),
      refDoc.linter.ruleSets
        ? section("RuleSets", [
            "Available ruleSets:",
            refDoc.linter.ruleSets.map((item) => ` - ${inlinecode(item.name)}`),
          ])
        : [],
      section("Rules", this.linterRuleToc(refDoc.linter.rules)),
    ];
  }

  /** Builds a rule-description table, linking names only when {@link linterRuleLink} provides a URL. */
  linterRuleToc(rules: LinterRuleRefDoc[]) {
    return table([
      ["Name", "Description"],
      ...rules.map((rule) => {
        const name = inlinecode(rule.name);
        const ruleLink = this.linterRuleLink(rule);
        const nameCell = ruleLink ? link(name, ruleLink) : name;
        return [nameCell, rule.rule.description];
      }),
    ]);
  }

  /** Returns the rule definition's documentation URL, or undefined to leave its table entry unlinked. */
  linterRuleLink(rule: LinterRuleRefDoc): string | undefined {
    return rule.rule.url;
  }
}
