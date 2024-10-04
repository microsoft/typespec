// Note: type annotations allow type checking and IDEs autocompletion

import type { VersionOptions } from "@docusaurus/plugin-content-docs";
import { NormalizedSidebar } from "@docusaurus/plugin-content-docs/src/sidebars/types.js";
import { Options } from "@docusaurus/preset-classic";
import type { Config, Plugin, ThemeConfig } from "@docusaurus/types";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";
import { resolve } from "path";
import { themes } from "prism-react-renderer";
import { LightTheme } from "./themes/light";

function getMajorMinorVersion(pkgJsonPath): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const version = require(pkgJsonPath).version;
  const [major, minor] = version.split(".");
  return `${major}.${minor}.x`;
}

const latestVersion = getMajorMinorVersion("../compiler/package.json");
const latestPretty = `Latest (${latestVersion})`;

function getVersionLabels(): Record<string, VersionOptions> {
  const labels: Record<string, VersionOptions> = {
    current: {
      label: `Next 🚧`,
    },
  };

  // Workaround because docusaurus validate this version exists but it doesn't during the bumping of version as we delete it to override
  const isBumpingVersion = process.argv.includes("docs:version");
  if (!isBumpingVersion) {
    labels.latest = {
      label: latestPretty,
    };
  }
  return labels;
}

// Reverse the sidebar items ordering (including nested category items)
function reverseSidebarItems(items: NormalizedSidebar) {
  // Reverse items in categories
  const result = items.map((item) => {
    if (item.type === "category") {
      return { ...item, items: reverseSidebarItems(item.items) };
    }
    return item;
  });
  // Reverse items at current level
  result.reverse();
  return result;
}

const baseUrl = process.env.TYPESPEC_WEBSITE_BASE_PATH ?? "/";
const config: Config = {
  title: "TypeSpec",
  tagline: "API first with TypeSpec for Azure services",
  url: "https://typespec.io",
  baseUrl,
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "throw",
  favicon: "img/favicon.svg",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "Microsoft", // Usually your GitHub org/user name.
  projectName: "typespec", // Usually your repo name.
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
    format: "detect",
  },
  scripts: [
    "https://consentdeliveryfd.azurefd.net/mscc/lib/v2/wcp-consent.js",
    {
      src: `${baseUrl}es-module-shims.js`,
      type: "module",
      async: true,
    },
    {
      src: `${baseUrl}1ds-init.js`,
      type: "module",
      async: true,
    },
  ],
  headTags: [
    {
      tagName: "script",
      attributes: {
        // cspell:ignore esms
        type: "esms-options",
      },
      innerHTML: JSON.stringify({
        shimMode: true,
      }),
    },
    {
      tagName: "script",
      attributes: {
        type: "playground-options",
      },
      innerHTML: JSON.stringify({
        latestVersion: latestVersion,
      }),
    },
  ],

  themes: ["@docusaurus/theme-mermaid"],
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          path: "../../docs",
          versions: getVersionLabels(),
          async sidebarItemsGenerator({ defaultSidebarItemsGenerator, ...args }) {
            const sidebarItems = await defaultSidebarItemsGenerator(args);
            return args.item.dirName === "release-notes"
              ? reverseSidebarItems(sidebarItems)
              : sidebarItems;
          },
        },

        blog: {
          path: "../../blog",
          showReadingTime: true,
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      } satisfies Options,
    ],
  ],
  staticDirectories: [
    resolve(__dirname, "static"),
    resolve(__dirname, "./node_modules/es-module-shims/dist"),
  ],

  plugins: [
    (context, options): Plugin => {
      return {
        name: "custom-configure-webpack",
        configureWebpack: (config, isServer, utils) => {
          // Need to change the font rule to use asset/resource
          const fontRule = config.module.rules.find(
            (x) => typeof x === "object" && x.test?.toString().includes("ttf"),
          );
          delete (fontRule as any).use;
          (fontRule as any).type = "asset/resource";

          return {
            plugins: [
              new MonacoWebpackPlugin({
                languages: ["json"],
              }),
            ],
            ignoreWarnings: [
              (warning, compilation) => {
                const moduleName: string | undefined = (warning.module as any)?.resource;
                return (
                  warning.name === "ModuleDependencyWarning" &&
                  warning.message.startsWith("Critical dependency") &&
                  (moduleName?.endsWith(
                    "node_modules/vscode-languageserver-types/lib/umd/main.js",
                  ) ||
                    moduleName?.endsWith("packages/compiler/dist/src/core/node-host.js"))
                );
              },
            ],
          };
        },
      };
    },
  ],
  webpack: {
    jsLoader: (isServer) => ({
      loader: require.resolve("swc-loader"),
      options: {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true,
          },
          transform: {
            react: {
              runtime: "automatic",
            },
          },
          target: "es2022",
        },
        module: {
          type: isServer ? "commonjs" : "es6",
        },
      },
    }),
  },
  themeConfig: {
    image: "img/social.png",
    navbar: {
      title: "TypeSpec",
      items: [
        {
          type: "dropdown",
          label: "Use cases",
          items: [
            {
              label: "OpenAPI",
              to: "/openapi",
            },
            {
              label: "Data validation and type consistency",
              to: "/data-validation",
            },
            {
              label: "Tooling support",
              to: "/tooling",
            },
          ],
        },
        {
          type: "doc",
          docId: "introduction/installation",
          position: "left",
          label: "Docs",
        },
        { to: "/playground", label: "Playground", position: "left" },
        {
          label: "Blog",
          to: "/blog",
        },
        {
          label: "Community",
          to: "/community",
        },
        {
          type: "docsVersionDropdown",
          position: "right",
        },
        {
          href: "https://github.com/microsoft/typespec",
          position: "right",
          className: "header-github-link",
          "aria-label": "Github repository",
        },
        {
          href: "https://aka.ms/typespec/discord",
          position: "right",
          className: "header-discord-link",
          "aria-label": "Discord server",
        },
      ],
    } satisfies ThemeConfig,
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Introduction",
              to: "/docs",
            },
            {
              label: "Language basics",
              to: "/docs/language-basics/overview",
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Microsoft`,
    },
    prism: {
      theme: LightTheme,
      darkTheme: themes.oneDark,
      additionalLanguages: ["http", "shell-session", "protobuf", "diff"],
    },
    mermaid: {},
    algolia: {
      // cspell:disable-next-line
      appId: "V3T9EUVLJR",
      // This is the search API KEY this can be public https://support.algolia.com/hc/en-us/articles/18966776061329-Can-the-search-API-key-be-public
      apiKey: "bae16ae67ddbe24e700ac20d192ad20f",
      indexName: "typespec",
    },
  } satisfies ThemeConfig,
};

export default config;
