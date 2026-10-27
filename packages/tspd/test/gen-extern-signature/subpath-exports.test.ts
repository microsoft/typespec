import { createTestHost, resolveVirtualPath } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import {
  generateExternSignatures,
  resolveSourceFileOwnership,
  resolveTypeSpecExports,
} from "../../src/gen-extern-signatures/gen-extern-signatures.js";

describe("resolveTypeSpecExports", () => {
  it("only keeps exports with a typespec condition and puts the root first", () => {
    const result = resolveTypeSpecExports("/lib", {
      name: "test-lib",
      exports: {
        "./streams": { typespec: "./lib/streams/main.tsp", default: "./dist/src/streams/index.js" },
        "./testing": { default: "./dist/src/testing/index.js" },
        ".": { typespec: "./lib/main.tsp", default: "./dist/src/index.js" },
      },
    } as any);

    expect(result).toEqual([
      {
        subpath: ".",
        typespecEntrypoint: "/lib/lib/main.tsp",
        hasJsEntrypoint: true,
      },
      {
        subpath: "./streams",
        typespecEntrypoint: "/lib/lib/streams/main.tsp",
        hasJsEntrypoint: true,
      },
    ]);
  });

  it("marks exports without a js condition", () => {
    const result = resolveTypeSpecExports("/lib", {
      name: "test-lib",
      exports: {
        ".": { typespec: "./lib/main.tsp" },
      },
    } as any);

    expect(result[0].hasJsEntrypoint).toBe(false);
  });
});

describe("resolveSourceFileOwnership", () => {
  it("attributes a file shared with the root to the root", () => {
    const [root, sub] = resolveSourceFileOwnership([
      ["main.tsp", "decorators.tsp"],
      ["streams.tsp", "main.tsp", "decorators.tsp"],
    ]);

    expect([...root]).toEqual(["main.tsp", "decorators.tsp"]);
    expect([...sub]).toEqual(["streams.tsp"]);
  });

  it("attributes a file shared between sibling exports to the first one declared", () => {
    const [a, b] = resolveSourceFileOwnership([
      ["a.tsp", "shared.tsp"],
      ["b.tsp", "shared.tsp"],
    ]);

    expect([...a]).toEqual(["a.tsp", "shared.tsp"]);
    expect([...b]).toEqual(["b.tsp"]);
  });
});

describe("generateExternSignatures with sub exports", () => {
  let host: Awaited<ReturnType<typeof createTestHost>>;

  beforeEach(async () => {
    host = await createTestHost();
  });

  function addPackageJson(exports: Record<string, Record<string, string>>) {
    host.addTypeSpecFile("package.json", JSON.stringify({ name: "test-lib", exports }));
  }

  async function generate() {
    const diagnostics = await generateExternSignatures(host.compilerHost, resolveVirtualPath("."));
    const files: Record<string, string> = {};
    const prefix = resolveVirtualPath("generated-defs") + "/";
    for (const [path, content] of host.fs.entries()) {
      if (path.startsWith(prefix)) {
        files[path.slice(prefix.length)] = content;
      }
    }
    return { files, diagnostics };
  }

  it("generates sub export signatures in a directory matching the subpath", async () => {
    addPackageJson({
      ".": { typespec: "./main.tsp", default: "./dist/index.js" },
      "./streams": { typespec: "./streams/main.tsp", default: "./dist/streams/index.js" },
    });
    host.addTypeSpecFile(
      "main.tsp",
      `
      namespace TestLib;
      extern dec rootDec(target: unknown);
    `,
    );
    host.addTypeSpecFile(
      "streams/main.tsp",
      `
      import "../main.tsp";
      namespace TestLib.Streams;
      extern dec streamDec(target: unknown);
    `,
    );

    const { files } = await generate();

    expect(Object.keys(files).sort()).toEqual([
      "TestLib.ts",
      "TestLib.ts-test.ts",
      "streams/TestLib.Streams.ts",
      "streams/TestLib.Streams.ts-test.ts",
    ]);
  });

  it("imports $decorators from the matching package sub export", async () => {
    addPackageJson({
      ".": { typespec: "./main.tsp", default: "./dist/index.js" },
      "./streams": { typespec: "./streams/main.tsp", default: "./dist/streams/index.js" },
    });
    host.addTypeSpecFile("main.tsp", `namespace TestLib;`);
    host.addTypeSpecFile(
      "streams/main.tsp",
      `
      import "../main.tsp";
      namespace TestLib.Streams;
      extern dec streamDec(target: unknown);
    `,
    );

    const { files } = await generate();

    expect(files["streams/TestLib.Streams.ts-test.ts"]).toContain(
      `import { $decorators } from "test-lib/streams";`,
    );
  });

  it("keeps decorators declared in files shared with the root on the root export", async () => {
    addPackageJson({
      ".": { typespec: "./main.tsp", default: "./dist/index.js" },
      "./streams": { typespec: "./streams/main.tsp", default: "./dist/streams/index.js" },
    });
    host.addTypeSpecFile(
      "main.tsp",
      `
      namespace TestLib;
      extern dec rootDec(target: unknown);
    `,
    );
    host.addTypeSpecFile("streams/main.tsp", `import "../main.tsp";`);

    const { files } = await generate();

    expect(Object.keys(files).sort()).toEqual(["TestLib.ts", "TestLib.ts-test.ts"]);
    expect(files["TestLib.ts-test.ts"]).toContain(`import { $decorators } from "test-lib";`);
  });

  it("warns and skips the typecheck file when a sub export has no js condition", async () => {
    addPackageJson({
      ".": { typespec: "./main.tsp", default: "./dist/index.js" },
      "./streams": { typespec: "./streams/main.tsp" },
    });
    host.addTypeSpecFile("main.tsp", `namespace TestLib;`);
    host.addTypeSpecFile(
      "streams/main.tsp",
      `
      import "../main.tsp";
      namespace TestLib.Streams;
      extern dec streamDec(target: unknown);
    `,
    );

    const { files, diagnostics } = await generate();

    expect(Object.keys(files)).toEqual(["streams/TestLib.Streams.ts"]);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe("@typespec/tspd/sub-export-missing-js");
    expect(diagnostics[0].severity).toBe("warning");
  });

  it("resolves symlinked source files to the same file", async () => {
    addPackageJson({
      ".": { typespec: "./main.tsp", default: "./dist/index.js" },
      "./streams": { typespec: "./streams/main.tsp", default: "./dist/streams/index.js" },
    });
    const rootContent = `
      namespace TestLib;
      extern dec rootDec(target: unknown);
    `;
    host.addTypeSpecFile("main.tsp", rootContent);
    // Same file reachable under a different path, as if it went through a symlink.
    host.addTypeSpecFile("linked/main.tsp", rootContent);
    host.addTypeSpecFile("streams/main.tsp", `import "../linked/main.tsp";`);

    const linked = resolveVirtualPath("linked/main.tsp");
    const compilerHost = {
      ...host.compilerHost,
      realpath: async (path: string) => (path === linked ? resolveVirtualPath("main.tsp") : path),
    };
    await generateExternSignatures(compilerHost, resolveVirtualPath("."));

    const prefix = resolveVirtualPath("generated-defs") + "/";
    const generated = [...host.fs.keys()]
      .filter((x) => x.startsWith(prefix))
      .map((x) => x.slice(prefix.length))
      .sort();
    expect(generated).toEqual(["TestLib.ts", "TestLib.ts-test.ts"]);
  });
});
