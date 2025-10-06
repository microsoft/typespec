import { it } from "vitest";
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
  const Tester = createTester(resolveVirtualPath("/test"), {
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
  const Tester = createTester(resolveVirtualPath("/test"), {
    host: fs,
    libraries: ["mylib"],
  });
  await Tester.compile(`import "mylib/subpath";`);
});
