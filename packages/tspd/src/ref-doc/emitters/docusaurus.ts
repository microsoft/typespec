import {
  NamedTypeRefDoc,
  TypeSpecLibraryRefDoc,
  TypeSpecRefDoc,
  TypeSpecRefDocBase,
} from "../types.js";
import {
  MarkdownDoc,
  codeblock,
  headings,
  inlinecode,
  renderMarkdowDoc,
  section,
  tabs,
} from "../utils/markdown.js";
import {
  MarkdownRenderer,
  groupByNamespace,
  renderDecoratorSection,
  renderEmitterUsage,
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

  const interfaceFile = renderInterfacesFile(renderer, refDoc);
  if (interfaceFile) {
    files["interfaces.md"] = interfaceFile;
  }

  const dataTypes = renderDataTypes(renderer, refDoc);
  if (dataTypes) {
    files["data-types.md"] = dataTypes;
  }

  const emitter = renderEmitter(refDoc);
  if (emitter) {
    files["emitter.md"] = emitter;
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

function renderInterfacesFile(
  renderer: DocusaurusRenderer,
  refDoc: TypeSpecRefDoc
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
    section("Interfaces and Operations", [
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
    ])
  );

  return renderMarkdowDoc(content);
}

function renderDataTypes(renderer: DocusaurusRenderer, refDoc: TypeSpecRefDoc): string | undefined {
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
      })
    )
  );

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
    renderEmitterUsage(refDoc),
  ];

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
