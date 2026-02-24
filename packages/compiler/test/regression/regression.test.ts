import { readdirSync } from "fs";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { it } from "vitest";
import { createTestRunner } from "../../src/testing/index.js";

const specsDir = resolve(import.meta.dirname, "specs");
const specFiles = readdirSync(specsDir).filter((f) => f.endsWith(".tsp"));

it.each(specFiles)("%s", async (file) => {
  const runner = await createTestRunner();
  const content = await readFile(resolve(specsDir, file), "utf-8");
  await runner.compile(content);
});
