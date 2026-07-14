import { beforeEach, expect, it } from "vitest";
import { resolveTypeSpecEntrypointForDir } from "../../src/core/entrypoint-resolution.js";
import type { CompilerHost } from "../../src/core/types.js";
import {
  createTestFileSystem,
  resolveVirtualPath,
  type TestFileSystem,
} from "../../src/testing/index.js";

let fs: TestFileSystem;
let host: CompilerHost;

beforeEach(async () => {
  fs = await createTestFileSystem();
  host = fs.compilerHost;
});

const dir = resolveVirtualPath("my-lib");

it("uses package.json tspMain when there is no tspconfig.yaml", async () => {
  fs.add("my-lib/package.json", JSON.stringify({ name: "my-lib", tspMain: "lib/main.tsp" }));
  const entrypoint = await resolveTypeSpecEntrypointForDir(host, dir, () => {});
  expect(entrypoint).toBe(resolveVirtualPath("my-lib/lib/main.tsp"));
});

it("uses package.json tspMain when tspconfig.yaml has no explicit entrypoint", async () => {
  fs.add("my-lib/package.json", JSON.stringify({ name: "my-lib", tspMain: "lib/main.tsp" }));
  fs.add("my-lib/tspconfig.yaml", `kind: project`);
  const entrypoint = await resolveTypeSpecEntrypointForDir(host, dir, () => {});
  expect(entrypoint).toBe(resolveVirtualPath("my-lib/lib/main.tsp"));
});

it("an explicit entrypoint in tspconfig.yaml takes precedence over package.json tspMain", async () => {
  fs.add("my-lib/package.json", JSON.stringify({ name: "my-lib", tspMain: "lib/main.tsp" }));
  fs.add("my-lib/tspconfig.yaml", `kind: project\nentrypoint: other.tsp`);
  const entrypoint = await resolveTypeSpecEntrypointForDir(host, dir, () => {});
  expect(entrypoint).toBe(resolveVirtualPath("my-lib/other.tsp"));
});

it("defaults to main.tsp when neither tspconfig entrypoint nor package.json tspMain is set", async () => {
  fs.add("my-lib/package.json", JSON.stringify({ name: "my-lib" }));
  fs.add("my-lib/tspconfig.yaml", `kind: project`);
  const entrypoint = await resolveTypeSpecEntrypointForDir(host, dir, () => {});
  expect(entrypoint).toBe(resolveVirtualPath("my-lib/main.tsp"));
});
