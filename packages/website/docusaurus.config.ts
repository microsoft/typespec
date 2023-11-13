// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import type { VersionOptions } from "@docusaurus/plugin-content-docs";
import type { Config, Plugin } from "@docusaurus/types";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";
import { resolve } from "path";
import { themes } from "prism-react-renderer";

function getMajorMinorVersion(pkgJsonPath): string {
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

const baseUrl = process.env.TYPESPEC_WEBSITE_BASE_PATH ?? "/";
const config: Config = {
  title: "TypeSpec",
  tagline: "API first with TypeSpec for Azure services",
  url: "https://microsoft.github.io",
  baseUrl,
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/azure.svg",

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
    {
      src: "es-module-shims.js",
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
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
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
      },
    ],
  ],
  staticDirectories: [
    resolve(__dirname, "./node_modules/@typespec/spec/dist"),
    resolve(__dirname, "./node_modules/es-module-shims/dist"),
  ],

  plugins: [
    (context, options): Plugin => {
      return {
        name: "custom-configure-webpack",
        configureWebpack: (config, isServer, utils) => {
          return {
            module: {
              rules: [
                {
                  test: /\.ttf$/,
                  use: ["file-loader"],
                },
              ],
            },
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
                    "node_modules/vscode-languageserver-types/lib/umd/main.js"
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
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    {
      navbar: {
        title: "TypeSpec",
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
            href: "https://github.com/microsoft/typespec",
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
        //         href: "https://stackoverflow.microsoft.com/search?q=typespec",
        //       },
        //       {
        //         label: "Microsoft Teams Channel",
        //         href: "http://aka.ms/typespec/discussions",
        //       },
        //     ],
        //   },
        // ],
        copyright: `Copyright © ${new Date().getFullYear()} Microsoft Corp.`,
      },
      prism: {
        theme: themes.oneLight,
        darkTheme: themes.dracula,
        additionalLanguages: [],
      },
      mermaid: {},
      algolia: {
        // cspell:disable-next-line
        appId: "V3T9EUVLJR",
        apiKey: "bae16ae67ddbe24e700ac20d192ad20f",
        indexName: "typespec",
      },
    },
};

export default config;
