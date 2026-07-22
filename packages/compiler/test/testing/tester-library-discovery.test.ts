import { expect, it } from "vitest";
import { CompilerHost } from "../../src/core/types.js";
import { createTestFileSystem, mockFile } from "../../src/testing/fs.js";
import { resolveVirtualPath } from "../../src/testing/test-utils.js";
import { createTester } from "../../src/testing/tester.js";
import { MockFile } from "../../src/testing/types.js";

function mkFs(files: Record<string, string | MockFile>): CompilerHost {
  const fs = createTestFileSystem();
  for (const [k, v] of Object.entries(files)) {
    fs.add(k, v);
  }
  return fs.compilerHost;
}

it("add library base export", async () => {
  const fs = mkFs({
    "package.json": JSON.stringify({ name: "test", version: "1.0.0" }),
    "node_modules/mylib/package.json": JSON.stringify({
      name: "mylib",
      version: "1.0.0",
      exports: { ".": { import: "./index.js", typespec: "./main.tsp" } },
    }),
    "node_modules/mylib/index.js": mockFile.js({}),
    "node_modules/mylib/main.tsp": "model FromMyLib {}",
  });
  const Tester = createTester(resolveVirtualPath(""), {
    host: fs,
    libraries: ["mylib"],
  });
  await Tester.compile(`import "mylib";
    alias Test = FromMyLib;  
  `);
});

it("subpath typespec export get added to the test host", async () => {
  const fs = mkFs({
    "package.json": JSON.stringify({ name: "test", version: "1.0.0" }),
    "node_modules/mylib/package.json": JSON.stringify({
      name: "mylib",
      version: "1.0.0",
      exports: { ".": { import: "./index.js" }, "./subpath": { typespec: "./subpath.tsp" } },
    }),
    "node_modules/mylib/index.js": mockFile.js({}),
    "node_modules/mylib/subpath.tsp": "",
  });
  const Tester = createTester(resolveVirtualPath(""), {
    host: fs,
    libraries: ["mylib"],
  });
  await Tester.compile(`import "mylib/subpath";`);
});

it("mounts a library's tspconfig.yaml so its opted-in features are honored", async () => {
  const fs = mkFs({
    "package.json": JSON.stringify({ name: "test", version: "1.0.0" }),
    "node_modules/mylib/package.json": JSON.stringify({
      name: "mylib",
      version: "1.0.0",
      exports: { ".": { import: "./index.js", typespec: "./main.tsp" } },
    }),
    "node_modules/mylib/index.js": mockFile.js({}),
    "node_modules/mylib/main.tsp": `
      namespace MyLib;
      auto dec myFlag(target: Reflection.Model);
    `,
    "node_modules/mylib/tspconfig.yaml": `kind: project\nfeatures:\n  - auto-decorators\n`,
  });
  const Tester = createTester(resolveVirtualPath(""), {
    host: fs,
    libraries: ["mylib"],
  });
  const [, diagnostics] = await Tester.compileAndDiagnose(`import "mylib";`);
  // Without the mounted tspconfig.yaml the library opt-in would be lost and the
  // `auto dec` declaration would report `auto-decorator-disabled`.
  expect(diagnostics.filter((d) => d.code === "auto-decorator-disabled")).toHaveLength(0);
});
