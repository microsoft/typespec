const toc = [
  { label: "Setup", items: ["installation", "releases"] },
  { label: "Configuration", items: ["configuration", "tracing"] },
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
    items: ["built-in-types", "built-in-decorators", "projected-names", "http", "openapi"],
  },
  {
    label: "Writing Cadl Libraries",
    items: ["basics", "create-decorators", "linters", "emitters"],
  },
  {
    label: "Release notes",
    collapsed: true,
    items: ["september-2022", "august-2022", "july-2022"],
  },
];

module.exports = { toc };
