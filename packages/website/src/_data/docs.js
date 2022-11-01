const toc = [
  {
    label: "Introduction",
    items: [
      "introduction",
      "installation",
      "usage",
      "formatter",
      {
        id: "configuration",
        label: "Configuration",
        items: ["configuration/configuration", "configuration/tracing"],
      },
      "releases",
      "faq",
    ],
  },
  {
    label: "Getting Started",
    items: ["getting-started"],
  },
  {
    label: "Language Basics",
    items: [
      "overview",
      "imports",
      "namespaces",
      "decorators",
      "models",
      "operations",
      "interfaces",
      "templates",
      "enums",
      "unions",
      "intersections",
      "type-literals",
      "aliases",
      "type-relations",
    ],
  },
  {
    label: "Cadl Standard Library",
    items: [
      "built-in-types",
      "built-in-decorators",
      "projected-names",
      {
        id: "http-and-rest",
        label: "Http And Rest",
        items: [
          "http/overview",
          "http/decorators",
          "http/operations",
          "http/authentication",
          "http/resource-routing",
        ],
      },
      "openapi",
    ],
  },
  {
    label: "Writing Cadl Libraries",
    items: ["basics", "create-decorators", "linters", "emitters"],
  },
  {
    id: "release-notes",
    label: "Release notes",
    collapsed: true,
    items: [
      "release-notes/october-2022",
      "release-notes/september-2022",
      "release-notes/august-2022",
      "release-notes/july-2022",
    ],
  },
];

module.exports = { toc };
