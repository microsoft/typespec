// @ts-check
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { TypeSpecLang } from "@typespec/astro-utils/shiki";
import { processSidebar } from "@typespec/astro-utils/sidebar";
import astroExpressiveCode from "astro-expressive-code";
import rehypeAstroRelativeMarkdownLinks from "astro-rehype-relative-markdown-links";
import { defineConfig } from "astro/config";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "pathe";
import rehypeMermaid from "rehype-mermaid";
import remarkHeadingID from "remark-heading-id";
import current from "./src/content/current-sidebar";
import { computeSriHash } from "./src/utils/sri-hash";

/** Scan the release-notes directory and return the slug of the latest release note. */
function getLatestReleaseNoteSlug() {
  const dir = resolve(import.meta.dirname, "src/content/docs/release-notes");
  const files = readdirSync(dir).filter((f) => /\.mdx?$/.test(f) && !f.startsWith("index"));

  let latestSlug = "";
  let latestDate = 0;

  for (const file of files) {
    const content = readFileSync(resolve(dir, file), "utf-8");
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;

    const dateMatch = fmMatch[1].match(/releaseDate:\s*(\S+)/);
    if (!dateMatch) continue;

    const date = new Date(dateMatch[1]).getTime();
    if (date > latestDate) {
      latestDate = date;
      const slugMatch = fmMatch[1].match(/slug:\s*(\S+)/);
      latestSlug = slugMatch ? slugMatch[1] : `release-notes/${file.replace(/\.mdx?$/, "")}`;
    }
  }

  return latestSlug;
}

const latestReleaseNote = getLatestReleaseNoteSlug();

const base = process.env.TYPESPEC_WEBSITE_BASE_PATH ?? "/";

const initJsIntegrity = computeSriHash("1ds-init.js");

// https://astro.build/config
export default defineConfig({
  base,
  site: "https://typespec.io",
  trailingSlash: "always",
  redirects: {
    // Point the old release-notes index to the latest release note.
    ...(latestReleaseNote ? { "/release-notes/": `/${latestReleaseNote}/` } : {}),
    // Redirect old /docs/ date-based paths to version-based (already existed in HEAD, updated targets)
    "/docs/release-notes/release-2025-04-02/": "/release-notes/typespec-1-0-0-rc-0/",
    "/docs/release-notes/release-2025-04-22/": "/release-notes/typespec-1-0-0-rc-1/",
    "/docs/release-notes/release-2025-05-06/": "/release-notes/typespec-1-0-0/",
    "/docs/release-notes/release-2025-06-10/": "/release-notes/typespec-1-1-0/",
    "/docs/release-notes/release-2025-07-15/": "/release-notes/typespec-1-2-0/",
    "/docs/release-notes/release-2025-08-06/": "/release-notes/typespec-1-3-0/",
    "/docs/release-notes/release-2025-09-09/": "/release-notes/typespec-1-4-0/",
    "/docs/release-notes/release-2025-10-08/": "/release-notes/typespec-1-5-0/",
    "/docs/release-notes/release-2025-11-11/": "/release-notes/typespec-1-6-0/",
    "/docs/release-notes/release-2025-12-09/": "/release-notes/typespec-1-7-0/",
    "/docs/release-notes/release-2026-01-13/": "/release-notes/typespec-1-8-0/",
    "/docs/release-notes/release-2026-02-10/": "/release-notes/typespec-1-9-0/",
    "/docs/release-notes/release-2026-03-10/": "/release-notes/typespec-1-10-0/",
  },
  integrations: [
    astroExpressiveCode(),
    starlight({
      title: "TypeSpec",
      sidebar: [
        ...(await processSidebar(
          resolve(import.meta.dirname, "src/content/docs"),
          "docs",
          current,
        )),
        {
          label: "🚀 Release Notes",
          link: latestReleaseNote ? `/${latestReleaseNote}/` : "/release-notes/",
        },
        {
          label: "🚀 Release Notes",
          autogenerate: { directory: "release-notes" },
        },
      ],
      favicon: "/img/favicon.svg",
      customCss: ["./src/css/custom.css"],
      components: {
        Header: "./src/components/header/header.astro",
        PageFrame: "./src/components/starlight-overrides/PageFrame.astro",
        Sidebar: "./src/components/starlight-overrides/Sidebar.astro",
      },
      expressiveCode: false, // defined directly above
      head: [
        {
          tag: "script",
          attrs: {
            src: "https://consentdeliveryfd.azurefd.net/mscc/lib/v2/wcp-consent.js",
            crossorigin: "anonymous",
          },
        },
        {
          tag: "script",
          attrs: {
            type: "module",
            async: true,
            src: "1ds-init.js",
            integrity: initJsIntegrity,
          },
        },
      ],
      social: [
        {
          label: "GitHub",
          icon: "github",
          href: "https://github.com/microsoft/typespec",
        },
        {
          label: "Discord",
          icon: "discord",
          href: "https://aka.ms/typespec/discord",
        },
      ],
      plugins: [],
    }),
    react(),
  ],
  markdown: {
    // @ts-expect-error wrong type
    remarkPlugins: [remarkHeadingID],
    rehypePlugins: [
      rehypeMermaid,
      [rehypeAstroRelativeMarkdownLinks, { base, collectionBase: false, trailingSlash: "always" }],
    ],
    shikiConfig: {
      langs: [TypeSpecLang],
    },
  },
});
