import type { Badge, SidebarItem } from "@typespec/astro-utils/sidebar";

type LibraryStability = "stable" | "preview" | "beta" | "alpha";

function getBadgeForLibraryStability(stability: LibraryStability | undefined): Badge | undefined {
  switch (stability) {
    case "preview":
      return { text: "preview", variant: "tip" };
    case "beta":
      return { text: "beta", variant: "caution" };
    case "alpha":
      return { text: "alpha", variant: "caution" };
    case "stable":
    default:
      return undefined;
  }
}
function createLibraryReferenceStructure(
  libDir: string,
  labelName: string,
  hasLinterRules: boolean,
  extra: SidebarItem[],
  stability?: LibraryStability,
): SidebarItem {
  const rules = {
    label: "Rules",
    autogenerate: { directory: `${libDir}/rules` },
  };
  return {
    label: labelName,
    index: `${libDir}/reference`,
    badge: getBadgeForLibraryStability(stability),
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
      "handbook/package-manager",
      "handbook/reproducibility",
      "handbook/breaking-change-policy",
      {
        label: "Configuration",
        items: ["handbook/configuration/configuration", "handbook/configuration/tracing"],
      },
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
      "language-basics/directives",
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
      "language-basics/visibility",
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
      "standard-library/pagination",
    ],
  },
  {
    label: "📚 Libraries",
    items: [
      createLibraryReferenceStructure("libraries/http", "Http", true, [
        "libraries/http/cheat-sheet",
        "libraries/http/authentication",
        "libraries/http/operations",
        "libraries/http/files",
        "libraries/http/content-types",
        "libraries/http/multipart",
        "libraries/http/encoding",
        "libraries/http/examples",
      ]),
      createLibraryReferenceStructure("libraries/openapi", "OpenAPI", false, []),
      createLibraryReferenceStructure(
        "libraries/rest",
        "Rest",
        false,
        ["libraries/rest/cheat-sheet", "libraries/rest/resource-routing"],
        "preview",
      ),
      createLibraryReferenceStructure("libraries/events", "Events", false, [], "preview"),
      createLibraryReferenceStructure("libraries/sse", "SSE", false, [], "preview"),
      createLibraryReferenceStructure("libraries/streams", "Streams", false, [], "preview"),
      createLibraryReferenceStructure(
        "libraries/versioning",
        "Versioning",
        false,
        ["libraries/versioning/guide"],
        "preview",
      ),
      createLibraryReferenceStructure(
        "libraries/xml",
        "Xml",
        false,
        ["libraries/xml/guide"],
        "preview",
      ),
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
      createLibraryReferenceStructure(
        "emitters/protobuf",
        "Protobuf",
        false,
        ["emitters/protobuf/guide"],
        "preview",
      ),
      {
        label: "Clients",
        items: [
          "emitters/clients/introduction",
          createLibraryReferenceStructure(
            "emitters/clients/http-client-js",
            "Javascript",
            false,
            [],
            "preview",
          ),
          createLibraryReferenceStructure(
            "emitters/clients/http-client-java",
            "Java",
            false,
            [],
            "preview",
          ),
          createLibraryReferenceStructure(
            "emitters/clients/http-client-python",
            "Python",
            false,
            [],
            "preview",
          ),
          createLibraryReferenceStructure(
            "emitters/clients/http-client-csharp",
            "CSharp",
            false,
            [],
            "preview",
          ),
        ],
      },
      {
        label: "Servers",
        items: [
          createLibraryReferenceStructure(
            "emitters/servers/http-server-csharp",
            "ASP.Net",
            false,
            ["emitters/servers/http-server-csharp/project"],
            "alpha",
          ),
          createLibraryReferenceStructure(
            "emitters/servers/http-server-js",
            "JavaScript",
            false,
            ["emitters/servers/http-server-js/project"],
            "alpha",
          ),
        ],
      },
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
