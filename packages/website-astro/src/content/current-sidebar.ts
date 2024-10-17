import type { SidebarItem } from "@site/sidebars";

function createLibraryReferenceStructure(
  libDir: string,
  labelName: string,
  hasLinterRules: boolean,
  extra: SidebarItem[],
): any {
  const rules = {
    label: "Rules",
    autogenerate: { directory: `${libDir}/rules` },
  };
  return {
    label: labelName,
    index: `${libDir}/reference`,
    items: [
      ...(hasLinterRules ? [rules] : []),
      {
        autogenerate: { directory: `${libDir}/reference` },
      },
      ...(extra ?? []),
    ],
  };
}

const sidebar: SidebarItem[] = [
  {
    label: "Getting started",
    items: [
      "",
      {
        label: "Editor",
        items: ["introduction/editor/vscode", "introduction/editor/vs"],
      },
    ],
  },
  {
    label: "Guides",
    items: [
      {
        label: "TypeSpec for REST",
        autogenerate: {
          directory: `getting-started/getting-started-rest`,
        },
      },
      "getting-started/typespec-for-openapi-dev",
    ],
  },
  {
    label: "Handbook",
    items: [
      "handbook/cli",
      "handbook/style-guide",
      "handbook/formatter",
      "handbook/reproducibility",
      {
        label: "Configuration",
        items: ["handbook/configuration/configuration", "handbook/configuration/tracing"],
      },
      "handbook/releases",
      "handbook/faq",
    ],
  },
  {
    label: "📐 Language Basics",
    items: [
      "language-basics/overview",
      "language-basics/built-in-types",
      "language-basics/identifiers",
      "language-basics/imports",
      "language-basics/namespaces",
      "language-basics/decorators",
      "language-basics/documentation",
      "language-basics/scalars",
      "language-basics/models",
      "language-basics/operations",
      "language-basics/interfaces",
      "language-basics/templates",
      "language-basics/enums",
      "language-basics/unions",
      "language-basics/intersections",
      "language-basics/type-literals",
      "language-basics/alias",
      "language-basics/values",
      "language-basics/type-relations",
    ],
  },
  {
    label: "📘 Standard Library",
    items: [
      "standard-library/built-in-decorators",
      "standard-library/built-in-data-types",
      {
        autogenerate: { directory: "standard-library/reference" },
      },
      "standard-library/encoded-names",
      "standard-library/discriminated-types",
      "standard-library/examples",
    ],
  },
  {
    label: "📚 Libraries",
    items: [
      createLibraryReferenceStructure("libraries/http", "Http", true, [
        "libraries/http/cheat-sheet",
        "libraries/http/authentication",
        "libraries/http/operations",
        "libraries/http/content-types",
        "libraries/http/multipart",
        "libraries/http/encoding",
        "libraries/http/examples",
      ]),
      createLibraryReferenceStructure("libraries/rest", "Rest", false, [
        "libraries/rest/cheat-sheet",
        "libraries/rest/resource-routing",
      ]),
      createLibraryReferenceStructure("libraries/openapi", "OpenAPI", false, []),
      createLibraryReferenceStructure("libraries/versioning", "Versioning", false, [
        "libraries/versioning/guide",
      ]),
      createLibraryReferenceStructure("libraries/xml", "Xml", false, ["libraries/xml/guide"]),
    ],
  },
  {
    label: "🖨️ Emitters",
    items: [
      createLibraryReferenceStructure("emitters/json-schema", "JSON Schema", false, []),
      createLibraryReferenceStructure("emitters/openapi3", "OpenAPI3", false, [
        "emitters/openapi3/openapi",
        "emitters/openapi3/cli",
        "emitters/openapi3/diagnostics",
      ]),
      createLibraryReferenceStructure("emitters/protobuf", "Protobuf", false, [
        "emitters/protobuf/guide",
      ]),
    ],
  },
  {
    label: "🛠️ Writing TypeSpec Libraries",
    items: [
      "extending-typespec/basics",
      "extending-typespec/diagnostics",
      "extending-typespec/create-decorators",
      "extending-typespec/linters",
      "extending-typespec/codefixes",
      "extending-typespec/emitters-basics",
      "extending-typespec/emitter-framework",
      "extending-typespec/emitter-metadata-handling",
      "extending-typespec/writing-scaffolding-template",
    ],
  },
  {
    label: "🚀 Release Notes",
    autogenerate: {
      order: "desc",
      directory: "release-notes",
    },
  },
];

export default sidebar;
