import {
  DeprecationNotice,
  DiagnosticRefDoc,
  LinterRuleRefDoc,
  NamedTypeRefDoc,
  RefDocEntity,
  SubExportRefDoc,
  TypeSpecLibraryRefDoc,
  TypeSpecRefDoc,
} from "../types.js";
import {
  MarkdownDoc,
  MarkdownSection,
  codeblock,
  inlinecode,
  renderMarkdowDoc,
  section,
} from "../utils/markdown.js";
import { MarkdownRenderer, groupByNamespace } from "./markdown.js";

export interface RenderToStarlightMarkdownOptions {
  llmstxt?: boolean;
}

/**
 * Render doc to a markdown using docusaurus addons.
 */
export function renderToAstroStarlightMarkdown(
  refDoc: TypeSpecRefDoc,
  options: RenderToStarlightMarkdownOptions = {},
): Record<string, string> {
  const renderer = new StarlightRenderer(refDoc);
  const files: Record<string, string> = {
    "index.mdx": renderIndexFile(renderer, refDoc),
  };

  const decoratorFile = renderDecoratorFile(renderer, refDoc, { llmstxt: options.llmstxt });
  if (decoratorFile) {
    files["decorators.md"] = decoratorFile;
  }

  const interfaceFile = renderInterfacesFile(renderer, refDoc, { llmstxt: options.llmstxt });
  if (interfaceFile) {
    files["interfaces.md"] = interfaceFile;
  }

  const dataTypes = renderDataTypes(renderer, refDoc, { llmstxt: options.llmstxt });
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

  for (const rule of refDoc.linter?.rules ?? []) {
    files[`rules/${rule.rule.name}.md`] = renderRule(rule);
  }

  // Generate one page per documented diagnostic, under `diagnostics/`. No index page.
  for (const diagnostic of refDoc.diagnostics ?? []) {
    if (diagnostic.doc) {
      files[`diagnostics/${diagnostic.name}.md`] = renderDiagnostic(diagnostic);
    }
  }

  // Render sub-exports
  if (refDoc.subExports) {
    for (const [exportPath, subExport] of refDoc.subExports) {
      const subFiles = renderSubExport(renderer, refDoc, exportPath, subExport, options);
      for (const [name, content] of Object.entries(subFiles)) {
        files[name] = content;
      }
    }
  }

  return files;
}

function renderIndexFile(renderer: StarlightRenderer, refDoc: TypeSpecLibraryRefDoc): string {
  const content: MarkdownDoc = [
    "---",
    `title: Overview`,
    `sidebar_position: 0`,
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
    "---",
    "import { Tabs, TabItem } from '@astrojs/starlight/components';",
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

export type DecoratorRenderOptions = {
  title?: string;
  llmstxt?: boolean;
};

export function renderDecoratorFile(
  renderer: StarlightRenderer,
  refDoc: TypeSpecRefDoc,
  options?: DecoratorRenderOptions,
): string | undefined {
  if (!refDoc.namespaces.some((x) => x.decorators.length > 0)) {
    return undefined;
  }
  const title = options?.title ?? "Decorators";
  const name = refDoc.name ?? refDoc.namespaces[0]?.name ?? "";
  const content: MarkdownDoc = [
    "---",
    `title: "${title}"`,
    `description: "Decorators ${name ? `exported by ${name}` : ""}"`,
    "toc_min_heading_level: 2",
    "toc_max_heading_level: 3",
  ];

  if (options?.llmstxt) {
    content.push("llmstxt: true");
  }

  content.push("---");

  content.push(renderer.decoratorsSection(refDoc));
  return renderMarkdowDoc(content, 2);
}

export type InterfacesRenderOptions = {
  llmstxt?: boolean;
};

function renderInterfacesFile(
  renderer: StarlightRenderer,
  refDoc: TypeSpecRefDoc,
  options?: InterfacesRenderOptions,
): string | undefined {
  if (!refDoc.namespaces.some((x) => x.operations.length > 0 || x.interfaces.length > 0)) {
    return undefined;
  }

  const title = "Interfaces and Operations";
  const name = refDoc.name ?? refDoc.namespaces[0]?.name ?? "";
  const content: MarkdownDoc = [
    "---",
    `title: "${title}"`,
    `description: "Interfaces and Operations ${name ? `exported by ${name}` : ""}"`,
  ];

  if (options?.llmstxt) {
    content.push("llmstxt: true");
  }

  content.push("---");

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

export type DataTypeRenderOptions = {
  title?: string;
  llmstxt?: boolean;
};

export function renderDataTypes(
  renderer: StarlightRenderer,
  refDoc: TypeSpecRefDoc,
  options?: DataTypeRenderOptions,
): string | undefined {
  if (!refDoc.namespaces.some((x) => x.models.length > 0)) {
    return undefined;
  }
  const title = options?.title ?? "Data types";
  const name = refDoc.name ?? refDoc.namespaces[0]?.name ?? "";
  const content: MarkdownDoc = [
    "---",
    `title: "${title}"`,
    `description: "Data types ${name ? `exported by ${name}` : ""}"`,
  ];

  if (options?.llmstxt) {
    content.push("llmstxt: true");
  }

  content.push("---");

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
  renderer: StarlightRenderer,
  refDoc: TypeSpecLibraryRefDoc,
): string | undefined {
  if (refDoc.emitter?.options === undefined) {
    return undefined;
  }
  const content: MarkdownDoc = [
    "---",
    `title: "Emitter usage"`,
    "---",
    renderer.emitterUsage(refDoc),
  ];

  return renderMarkdowDoc(content, 2);
}
function renderLinter(
  renderer: StarlightRenderer,
  refDoc: TypeSpecLibraryRefDoc,
): string | undefined {
  if (refDoc.linter === undefined) {
    return undefined;
  }
  const content: MarkdownDoc = [
    "---",
    `title: "Linter usage"`,
    "---",
    renderer.linterUsage(refDoc),
  ];
  return renderMarkdowDoc(content, 2);
}

function renderRule(rule: LinterRuleRefDoc): string {
  const content: MarkdownDoc = [
    "---",
    `title: "${rule.rule.name}"`,
    "---",
    "",
    codeblock(rule.name, 'text title="Id"'),
    "",
    rule.rule.description,
  ];
  if (rule.doc) {
    content.push("", rule.doc);
  }
  return renderMarkdowDoc(content, 2);
}

function renderDiagnostic(diagnostic: DiagnosticRefDoc): string {
  const content: MarkdownDoc = [
    "---",
    `title: "${diagnostic.name}"`,
    "---",
    "",
    codeblock(diagnostic.id, 'text title="Id"'),
    "",
    `**Severity:** ${diagnostic.severity}`,
  ];
  if (diagnostic.doc) {
    content.push("", diagnostic.doc);
  }
  return renderMarkdowDoc(content, 2);
}

function renderSubExport(
  renderer: StarlightRenderer,
  refDoc: TypeSpecRefDoc,
  exportPath: string,
  subExport: SubExportRefDoc,
  options: RenderToStarlightMarkdownOptions,
): Record<string, string> {
  const files: Record<string, string> = {};
  // Use the export path as a directory prefix (e.g., "./streams" -> "streams/")
  const dirPrefix = exportPath.replace(/^\.\//, "") + "/";
  const displayName = exportPath.replace(/^\.\//, "");

  // Decorators
  if (subExport.namespaces.some((x) => x.decorators.length > 0)) {
    const content: MarkdownDoc = [
      "---",
      `title: "Decorators (${displayName})"`,
      `description: "Decorators exported by ${refDoc.name}/${displayName}"`,
      "toc_min_heading_level: 2",
      "toc_max_heading_level: 3",
    ];
    if (options.llmstxt) {
      content.push("llmstxt: true");
    }
    content.push("---");
    content.push(renderer.decoratorsSection(subExport));
    files[`${dirPrefix}decorators.md`] = renderMarkdowDoc(content, 2);
  }

  // Interfaces and Operations
  if (subExport.namespaces.some((x) => x.operations.length > 0 || x.interfaces.length > 0)) {
    const content: MarkdownDoc = [
      "---",
      `title: "Interfaces and Operations (${displayName})"`,
      `description: "Interfaces and Operations exported by ${refDoc.name}/${displayName}"`,
    ];
    if (options.llmstxt) {
      content.push("llmstxt: true");
    }
    content.push("---");
    content.push(
      groupByNamespace(subExport.namespaces, (namespace) => {
        if (namespace.operations.length === 0 && namespace.interfaces.length === 0) {
          return undefined;
        }
        const nsContent: MarkdownDoc = [];
        for (const iface of namespace.interfaces) {
          nsContent.push(renderer.interface(iface), "");
        }
        for (const operation of namespace.operations) {
          nsContent.push(renderer.operation(operation), "");
        }
        return nsContent;
      }),
    );
    files[`${dirPrefix}interfaces.md`] = renderMarkdowDoc(content, 2);
  }

  // Data types (models, enums, unions, scalars)
  if (
    subExport.namespaces.some(
      (x) =>
        x.models.length > 0 || x.enums.length > 0 || x.unions.length > 0 || x.scalars.length > 0,
    )
  ) {
    const content: MarkdownDoc = [
      "---",
      `title: "Data types (${displayName})"`,
      `description: "Data types exported by ${refDoc.name}/${displayName}"`,
    ];
    if (options.llmstxt) {
      content.push("llmstxt: true");
    }
    content.push("---");
    content.push(
      groupByNamespace(subExport.namespaces, (namespace) => {
        const modelCount =
          namespace.models.length +
          namespace.enums.length +
          namespace.unions.length +
          namespace.scalars.length;
        if (modelCount === 0) {
          return undefined;
        }
        const nsContent: MarkdownDoc = [];
        for (const model of namespace.models) {
          nsContent.push(renderer.model(model), "");
        }
        for (const e of namespace.enums) {
          nsContent.push(renderer.enum(e), "");
        }
        for (const union of namespace.unions) {
          nsContent.push(renderer.union(union), "");
        }
        for (const scalar of namespace.scalars) {
          nsContent.push(renderer.scalar(scalar), "");
        }
        return nsContent;
      }),
    );
    files[`${dirPrefix}data-types.md`] = renderMarkdowDoc(content, 2);
  }

  return files;
}

export class StarlightRenderer extends MarkdownRenderer {
  headingTitle(item: NamedTypeRefDoc): string {
    // Set an explicit anchor id.
    return `${inlinecode(item.name)} {#${item.id}}`;
  }
  anchorId(item: NamedTypeRefDoc): string {
    // Set an explicit anchor id.
    return item.id;
  }

  install(refDoc: TypeSpecLibraryRefDoc): MarkdownSection {
    return section(
      "Install",
      tabs([
        {
          label: "In a spec",
          content: codeblock(`npm install ${refDoc.name}`, "bash"),
        },
        {
          label: "In a library",
          content: codeblock(`npm install --save-peer ${refDoc.name}`, "bash"),
        },
      ]),
    );
  }

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

  linterRuleLink(rule: LinterRuleRefDoc) {
    return `./rules/${rule.rule.name}.md`;
  }

  deprecationNotice(notice: DeprecationNotice): MarkdownDoc {
    return [":::caution", `**Deprecated**: ${notice.message}`, ":::"];
  }
}

type Tab = {
  label: string;
  content: string;
};

function tabs(tabs: Tab[]) {
  const result = ["<Tabs>"];
  for (const tab of tabs) {
    result.push(`<TabItem  label="${tab.label}" default>`, "", tab.content, "", "</TabItem>");
  }
  result.push("</Tabs>", "");
  return result.join("\n");
}
