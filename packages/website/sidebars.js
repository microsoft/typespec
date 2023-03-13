// @ts-check

/**
 *
 * @param {string} libName
 * @param {any[]} [extra]
 * @returns {any}
 */
function createLibraryReferenceStructure(libName, extra) {
  return {
    type: "category",
    label: "Reference",
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
        "standard-library/built-in-types",
        "standard-library/built-in-decorators",
        "standard-library/projected-names",
        {
          type: "category",
          label: "Http And Rest",
          items: [
            "standard-library/rest/overview",
            createLibraryReferenceStructure("rest"),
            "standard-library/rest/operations",
            "standard-library/rest/authentication",
            "standard-library/rest/resource-routing",
          ],
        },
        {
          type: "category",
          label: "OpenAPI",
          items: [
            "standard-library/openapi/overview",
            createLibraryReferenceStructure("openapi", ["standard-library/openapi/diagnostics"]),
            "standard-library/openapi/openapi",
          ],
        },
        {
          type: "category",
          label: "Versioning",
          items: [
            "standard-library/versioning/overview",
            createLibraryReferenceStructure("versioning"),
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Writing TypeSpec Libraries",
      items: [
        "extending-typespec/basics",
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
      label: "Compiler Reference",
      link: {
        type: "doc",
        id: `compiler/reference/index`,
      },
      items: [
        {
          type: "autogenerated",
          dirName: `compiler`,
        },
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
