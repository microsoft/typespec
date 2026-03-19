import { readdirSync } from "fs";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { it } from "vitest";
import { Tester } from "../tester.js";

const specsDir = resolve(import.meta.dirname, "specs");
const specFiles = readdirSync(specsDir).filter((f) => f.endsWith(".tsp"));

it.each(specFiles)("%s", async (file) => {
  const content = await readFile(resolve(specsDir, file), "utf-8");
  await Tester.compile(content);
});
