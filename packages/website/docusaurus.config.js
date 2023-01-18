// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

// const lightCodeTheme = require("prism-react-renderer/themes/github");
const lightCodeTheme = require("./themes/prism/atom-one-light.js");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
const { resolve } = require("path");

function getMajorMinorVersion(pkgJsonPath) {
  const version = require(pkgJsonPath).version;
  const [major, minor] = version.split(".");
  return `${major}.${minor}.x`;
}

function getLatestVersion() {
  return `Latest (${getMajorMinorVersion("../compiler/package.json")})`;
}

/** @returns {Record<string, import('@docusaurus/plugin-content-docs').VersionOptions>} */
function getVersionLabels() {
  const labels = {
    current: {
      label: `Next 🚧`,
    },
  };

  // Workaround because docusaurus validate this version exists but it doesn't during the bumping of version as we delete it to override
  const isBumpingVersion = process.argv.includes("docs:version");
  if (!isBumpingVersion) {
    labels.latest = {
      label: getLatestVersion(),
    };
  }
  return labels;
}

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Cadl",
  tagline: "API first with Cadl for Azure services",
  url: "https://microsoft.github.io",
  baseUrl: process.env.CADL_WEBSITE_BASE_PATH ?? "/",
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/azure.svg",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "Microsoft", // Usually your GitHub org/user name.
  projectName: "cadl", // Usually your repo name.
  trailingSlash: false,

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  markdown: {
    mermaid: true,
  },
  themes: ["@docusaurus/theme-mermaid"],
  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",
          sidebarPath: require.resolve("./sidebars.js"),
          path: "../../docs",
          versions: getVersionLabels(),
        },

        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],
  staticDirectories: [resolve(__dirname, "./node_modules/@cadl-lang/spec/dist")],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "Cadl",
        items: [
          {
            type: "doc",
            docId: "introduction/introduction",
            position: "left",
            label: "Docs",
          },
          {
            to: "/specification",
            position: "left",
            label: "Specification",
          },
          { to: "/playground", label: "Playground", position: "left" },
          {
            type: "docsVersionDropdown",
            position: "right",
          },
          {
            href: "https://github.com/Microsoft/cadl",
            position: "right",
            className: "header-github-link",
            "aria-label": "Github repository",
          },
        ],
      },
      footer: {
        style: "dark",
        // links: [
        //   {
        //     title: "Docs",
        //     items: [
        //       {
        //         label: "Introduction",
        //         to: "/",
        //       },
        //       {
        //         label: "Language basics",
        //         to: "/language-basics/overview",
        //       },
        //     ],
        //   },
        //   {
        //     title: "Community & Support",
        //     items: [
        //       {
        //         label: "Stack Overflow",
        //         href: "https://stackoverflow.microsoft.com/search?q=cadl",
        //       },
        //       {
        //         label: "Microsoft Teams Channel",
        //         href: "http://aka.ms/cadl/discussions",
        //       },
        //     ],
        //   },
        // ],
        copyright: `Copyright © ${new Date().getFullYear()} Microsoft Corp.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: [],
      },
      mermaid: {},
      algolia: {
        // cspell:disable-next-line
        appId: "WQXW45O51C",
        apiKey: "9bfd71f94d516117e3022e788f2cc83c",
        indexName: "cadl",
      },
    }),
};

module.exports = config;
