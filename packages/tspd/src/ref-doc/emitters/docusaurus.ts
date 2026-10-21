import type {
  DeprecationNotice,
  LinterRuleRefDoc,
  NamedTypeRefDoc,
  RefDocEntity,
  TypeSpecLibraryRefDoc,
  TypeSpecRefDoc,
  TypeSpecRefDocBase,
} from "../types.js";
import type { MarkdownDoc, MarkdownSection } from "../utils/markdown.js";
import { codeblock, inlinecode, renderMarkdowDoc, section } from "../utils/markdown.js";
import { MarkdownRenderer, groupByNamespace } from "./markdown.js";

/**
 * Builds a filename-to-content map for Docusaurus without writing files.
 * Always includes `index.mdx`; adds declaration, emitter, and linter pages when their
 * corresponding render helpers produce content. Rule links expect separately supplied
 * pages under `../rules`; this function does not generate rule or diagnostic pages.
 */
export function renderToDocusaurusMarkdown(refDoc: TypeSpecRefDoc): Record<string, string> {
  const renderer = new DocusaurusRenderer(refDoc);
  const files: Record<string, string> = {
    "index.mdx": renderIndexFile(renderer, refDoc),
  };

  const decoratorFile = renderDecoratorFile(renderer, refDoc);
  if (decoratorFile) {
    files["decorators.md"] = decoratorFile;
  }

  const interfaceFile = renderInterfacesFile(renderer, refDoc);
  if (interfaceFile) {
    files["interfaces.md"] = interfaceFile;
  }

  const dataTypes = renderDataTypes(renderer, refDoc);
  if (dataTypes) {
    files["data-types.md"] = dataTypes;
  }

  const emitter = renderEmitter(renderer, refDoc);
  if (emitter) {
    files["emitter.md"] = emitter;
  }
  const linter = renderLinter(renderer, refDoc);
  if (linter) {
    files["linter.md"] = linter;
  }

  return files;
}

function renderIndexFile(renderer: DocusaurusRenderer, refDoc: TypeSpecLibraryRefDoc): string {
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

    refDoc.description ?? [],
    renderer.install(refDoc),
    refDoc.emitter?.options ? section("Emitter usage", `[See documentation](./emitter.md)`) : [],

    groupByNamespace(refDoc.namespaces, (namespace) => {
      const content = [];

      if (namespace.decorators.length > 0) {
        content.push(section("Decorators", renderer.toc(namespace.decorators)));
      }

      if (namespace.interfaces.length > 0) {
        content.push(section("Interfaces", renderer.toc(namespace.interfaces)));
      }

      if (namespace.operations.length > 0) {
        content.push(section("Operations", renderer.toc(namespace.operations)));
      }

      if (namespace.models.length > 0) {
        content.push(section("Models", renderer.toc(namespace.models)));
      }
      return content;
    }),
  ];

  return renderMarkdowDoc(content, 2);
}

/** Front matter customization for a standalone decorator page. */
export type DecoratorRenderOptions = {
  /** Page title; defaults to `"Decorators"`. */
  title?: string;
};

/** Renders a decorator page with Docusaurus front matter, or undefined when there are no decorators. */
export function renderDecoratorFile(
  renderer: DocusaurusRenderer,
  refDoc: TypeSpecRefDocBase,
  options?: DecoratorRenderOptions,
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

  content.push(renderer.decoratorsSection(refDoc));
  return renderMarkdowDoc(content, 2);
}

function renderInterfacesFile(
  renderer: DocusaurusRenderer,
  refDoc: TypeSpecRefDoc,
): string | undefined {
  if (!refDoc.namespaces.some((x) => x.operations.length > 0 || x.interfaces.length > 0)) {
    return undefined;
  }
  const content: MarkdownDoc = [
    "---",
    `title: "Interfaces and Operations"`,
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
    "---",
  ];

  content.push(
    groupByNamespace(refDoc.namespaces, (namespace) => {
      if (namespace.operations.length === 0 && namespace.interfaces.length === 0) {
        return undefined;
      }

      const content: MarkdownDoc = [];
      for (const iface of namespace.interfaces) {
        content.push(renderer.interface(iface), "");
      }

      for (const operation of namespace.operations) {
        content.push(renderer.operation(operation), "");
      }
      return content;
    }),
  );

  return renderMarkdowDoc(content, 2);
}

/** Front matter customization for the combined data-type page. */
export type DataTypeRenderOptions = {
  /** Page title; defaults to `"Data types"`. */
  title?: string;
};

/**
 * Renders models, enums, unions, and scalars grouped by namespace.
 * Returns undefined unless at least one namespace contains a model, even if other data types exist.
 */
export function renderDataTypes(
  renderer: DocusaurusRenderer,
  refDoc: TypeSpecRefDoc,
  options?: DataTypeRenderOptions,
): string | undefined {
  if (!refDoc.namespaces.some((x) => x.models.length > 0)) {
    return undefined;
  }
  const title = options?.title ?? "Data types";
  const content: MarkdownDoc = [
    "---",
    `title: "${title}"`,
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
    "---",
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
      const content: MarkdownDoc = [];
      for (const model of namespace.models) {
        content.push(renderer.model(model), "");
      }
      for (const e of namespace.enums) {
        content.push(renderer.enum(e), "");
      }
      for (const union of namespace.unions) {
        content.push(renderer.union(union), "");
      }
      for (const scalar of namespace.scalars) {
        content.push(renderer.scalar(scalar), "");
      }
      return content;
    }),
  );

  return renderMarkdowDoc(content, 2);
}

function renderEmitter(
  renderer: DocusaurusRenderer,
  refDoc: TypeSpecLibraryRefDoc,
): string | undefined {
  if (refDoc.emitter?.options === undefined) {
    return undefined;
  }
  const content: MarkdownDoc = [
    "---",
    `title: "Emitter usage"`,
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
    "---",
    renderer.emitterUsage(refDoc),
  ];

  return renderMarkdowDoc(content, 2);
}
function renderLinter(
  renderer: DocusaurusRenderer,
  refDoc: TypeSpecLibraryRefDoc,
): string | undefined {
  if (refDoc.linter === undefined) {
    return undefined;
  }
  const content: MarkdownDoc = [
    "---",
    `title: "Linter usage"`,
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
    "---",
    renderer.linterUsage(refDoc),
  ];

  return renderMarkdowDoc(content, 2);
}

/** Markdown renderer with Docusaurus explicit anchors, install tabs, and warning admonitions. */
export class DocusaurusRenderer extends MarkdownRenderer {
  /** Adds an explicit `{#id}` anchor after the inline-code display name. */
  headingTitle(item: NamedTypeRefDoc): string {
    // Set an explicit anchor id.
    return `${inlinecode(item.name)} {#${item.id}}`;
  }
  /** Uses the qualified reference ID verbatim, matching the explicit heading anchor. */
  anchorId(item: NamedTypeRefDoc): string {
    // Set an explicit anchor id.
    return item.id;
  }

  /** Builds spec/library npm-install tabs; the containing page must import Docusaurus tab components. */
  install(refDoc: TypeSpecLibraryRefDoc): MarkdownSection {
    return section(
      "Install",
      tabs([
        {
          id: "spec",
          label: "In a spec",
          content: codeblock(`npm install ${refDoc.name}`, "bash"),
        },
        {
          id: "library",
          label: "In a library",
          content: codeblock(`npm install --save-peer ${refDoc.name}`, "bash"),
        },
      ]),
    );
  }

  /**
   * Routes decorators, operations/interfaces, and models/enums/unions to their shared Markdown pages.
   * Other entity kinds, including scalars, retain a same-page link with an empty file component.
   */
  filename(type: RefDocEntity): string {
    switch (type.kind) {
      case "decorator":
        return "./decorators.md";
      case "operation":
      case "interface":
        return "./interfaces.md";
      case "model":
      case "enum":
      case "union":
        return "./data-types.md";
      default:
        return "";
    }
  }

  /** Targets a separately maintained `../rules/<unqualified-rule-name>.md` page. */
  linterRuleLink(rule: LinterRuleRefDoc) {
    return `../rules/${rule.rule.name}.md`;
  }

  /** Formats the message as a Docusaurus warning admonition. */
  deprecationNotice(notice: DeprecationNotice): MarkdownDoc {
    return [":::warning", `**Deprecated**: ${notice.message}`, ":::"];
  }
}

type Tab = {
  id: string;
  label: string;
  content: string;
};

function tabs(tabs: Tab[]) {
  const result = ["<Tabs>"];
  for (const tab of tabs) {
    result.push(
      `<TabItem value="${tab.id}" label="${tab.label}" default>`,
      "",
      tab.content,
      "",
      "</TabItem>",
    );
  }
  result.push("</Tabs>", "");
  return result.join("\n");
}
