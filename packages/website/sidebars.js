// @ts-check

/**
 *
 * @param {string} libName
 * @param {any[]} [extra]
 * @returns {any}
 */
function createLibraryReferenceStructure(libName, labelName, extra) {
  return {
    type: "category",
    label: labelName,
    link: {
      type: "doc",
      id: `standard-library/${libName}/reference/index`,
    },
    items: [
      {
        type: "autogenerated",
        dirName: `standard-library/${libName}/reference`,
      },
      ...(extra ?? []),
    ],
  };
}

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    {
      type: "category",
      label: "Introduction",
      items: [
        "introduction/introduction",
        "introduction/installation",
        "introduction/usage",
        "introduction/style-guide",
        "introduction/formatter",
        "introduction/reproducibility",
        {
          type: "category",
          label: "Configuration",
          items: ["introduction/configuration/configuration", "introduction/configuration/tracing"],
        },
        "introduction/releases",
        "introduction/faq",
      ],
    },
    {
      type: "category",
      label: "Getting Started",
      items: ["getting-started/getting-started", "getting-started/typespec-for-openapi-dev"],
    },
    {
      type: "category",
      label: "Language Basics",
      items: [
        "language-basics/overview",
        "language-basics/built-in-types",
        "language-basics/imports",
        "language-basics/namespaces",
        "language-basics/decorators",
        "language-basics/scalars",
        "language-basics/models",
        "language-basics/operations",
        "language-basics/interfaces",
        "language-basics/templates",
        "language-basics/enums",
        "language-basics/unions",
        "language-basics/intersections",
        "language-basics/type-literals",
        "language-basics/aliases",
        "language-basics/type-relations",
      ],
    },
    {
      type: "category",
      label: "TypeSpec Standard Library",
      items: [
        "standard-library/built-in-decorators",
        {
          type: "autogenerated",
          dirName: `standard-library/reference`,
        },
        "standard-library/projected-names",
        "standard-library/discriminated-types",
        createLibraryReferenceStructure("http", "Http", [
          "standard-library/http/cheat-sheet",
          "standard-library/http/authentication",
          "standard-library/http/operations",
          "standard-library/http/encoding",
        ]),
        createLibraryReferenceStructure("json-schema", "JSON Schema", []),
        createLibraryReferenceStructure("rest", "Rest", [
          "standard-library/rest/cheat-sheet",
          "standard-library/rest/resource-routing",
        ]),
        createLibraryReferenceStructure("openapi", "OpenAPI", []),
        createLibraryReferenceStructure("openapi3", "OpenAPI3", [
          "standard-library/openapi3/openapi",
          "standard-library/openapi3/diagnostics",
        ]),
        createLibraryReferenceStructure("protobuf", "Protobuf", [
          "standard-library/protobuf/guide",
        ]),
        createLibraryReferenceStructure("versioning", "Versioning", [
          "standard-library/versioning/guide",
        ]),
      ],
    },
    {
      type: "category",
      label: "Writing TypeSpec Libraries",
      items: [
        "extending-typespec/basics",
        "extending-typespec/diagnostics",
        "extending-typespec/create-decorators",
        "extending-typespec/linters",
        "extending-typespec/emitters",
        "extending-typespec/emitter-framework",
        "extending-typespec/emitter-metadata-handling",
        "extending-typespec/writing-scaffolding-template",
      ],
    },
    {
      type: "category",
      label: "Release Notes",
      collapsed: true,
      link: {
        type: "generated-index",
        title: "Release Notes",
        slug: "/release-notes",
      },
      items: [
        {
          type: "autogenerated",
          dirName: "release-notes",
        },
      ],
    },
  ],
};

module.exports = sidebars;
