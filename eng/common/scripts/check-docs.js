// @ts-check

// cspell:ignore astro
// This script check the docs are compatible for astro to simplify migration
// It check each docs has
//  - a `title:` frontmatter
import { readFile, readdir } from "fs/promises";
import { resolve } from "path";
import { repoRoot } from "./helpers.js";

const docsFolder = resolve(repoRoot, "docs");

async function findMarkdownFiles(folder) {
  const items = await readdir(folder, { withFileTypes: true });

  return (
    await Promise.all(
      items.map(async (item) => {
        if (item.isDirectory()) {
          const files = await findMarkdownFiles(resolve(folder, item.name));
          return files.map((x) => resolve(folder, x));
        }

        if (item.name.endsWith(".md")) {
          return [resolve(folder, item.name)];
        } else {
          return [];
        }
      }),
    )
  ).flat();
}
await main();

async function main() {
  const docs = await findMarkdownFiles(docsFolder);

  const failure = [];
  const regex = /^---.*title:.*---$/ms;
  for (const doc of docs) {
    const buffer = await readFile(doc, { encoding: "utf-8" });
    const content = buffer.toString();
    if (!regex.test(content)) {
      failure.push(doc);
    }
  }

  if (failure.length > 0) {
    console.log("Files with missing title: frontmatter", failure);

    console.log(
      [
        "Make sure to add front matter in the file with title, e.g.:",
        "---",
        "title: xyz",
        "---",
      ].join("\n"),
    );
    process.exit(1);
  } else {
    console.log("Docs look good!");
  }
}
