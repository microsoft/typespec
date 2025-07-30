import { resolvePath } from "@typespec/compiler";
import {
  createTester,
  expectDiagnosticEmpty,
  expectDiagnostics,
  type MockFile,
  mockFile,
} from "@typespec/compiler/testing";
import { ok } from "assert";
import { describe, expect, it } from "vitest";
import { combineProjectIntoFile, ImportResult } from "../src/pack.js";
import { d } from "./utils.js";

const Tester = createTester(resolvePath(import.meta.dirname, ".."), { libraries: [] });

async function combine(files: Record<string, string | MockFile>): Promise<ImportResult> {
  const tester = await Tester.createInstance();
  for (const [name, content] of Object.entries(files)) {
    tester.fs.add(name, content);
  }
  return combineProjectIntoFile(tester.fs.compilerHost, "main.tsp");
}

async function combineTo(files: Record<string, string | MockFile>): Promise<string> {
  const result = await combine(files);
  expectDiagnosticEmpty(result.diagnostics);
  ok(result.content);
  return result.content;
}

it("insert imported local files", async () => {
  expect(
    await combineTo({
      "main.tsp": d`
        import "./a.tsp";
        import "./b.tsp";
        model Main {
          a: A;
          b: B;
        }`,
      "a.tsp": "model A {}",
      "b.tsp": "model B {}",
    }),
  ).toEqual(d`
      model Main {
        a: A;
        b: B;
      }
      model A {}
      model B {}

    `);
});

it("keeps imports of libraries", async () => {
  expect(
    await combineTo({
      "main.tsp": d`
        import "my-lib";
        import "./b.tsp";
        model Main {
          a: A;
          b: B;
        }`,
      "b.tsp": "model B {}",
    }),
  ).toEqual(d`
      import "my-lib";
      model Main {
        a: A;
        b: B;
      }
      model B {}

    `);
});

describe("namespaces", () => {
  it("merges file namespaces", async () => {
    expect(
      await combineTo({
        "main.tsp": d`
        import "./a.tsp";

        namespace Main;

        model Main {}
      `,
        "a.tsp": d`
        namespace Main.A;

        model A {}
      `,
      }),
    ).toEqual(d`
      namespace Main {
        model Main {}
      }
      namespace Main.A {
        model A {}
      }

    `);
  });

  it("merges same named namespaces", async () => {
    expect(
      await combineTo({
        "main.tsp": d`
        import "./a.tsp";

        namespace Main;

        model Main {}
      `,
        "a.tsp": d`
        namespace Main;

        model A {}
      `,
      }),
    ).toEqual(d`
      namespace Main {
        model Main {}
      }
      namespace Main {
        model A {}
      }

  `);
  });

  it("merges files with multiple namespaces", async () => {
    expect(
      await combineTo({
        "main.tsp": d`
        import "./a.tsp";

        namespace A {
          model A {}
        }
        namespace B {
          model B {}
        }
      `,
        "a.tsp": d`
        namespace C {
          model C {}
        }
        namespace D {
          model D {}
        }
      `,
      }),
    ).toEqual(d`
      namespace A {
        model A {}
      }
      namespace B {
        model B {}
      }
      namespace C {
        model C {}
      }
      namespace D {
        model D {}
      }
      
    `);
  });
});

describe("comments", () => {
  it.skip("single line comment", async () => {
    expect(
      await combineTo({
        "main.tsp": d`
        // Test
        model Main {}
      `,
      }),
    ).toEqual(d`
      // Test
      model Main {}

    `);
  });

  it.skip("multi line comment", async () => {
    expect(
      await combineTo({
        "main.tsp": d`
        /*
          * Test
          */
        model Main {}
      `,
      }),
    ).toEqual(d`
      /*
        * Test
        */
      model Main {}

    `);
  });

  it("single line doc comment", async () => {
    expect(
      await combineTo({
        "main.tsp": d`
        /** Test */
        model Main {}
      `,
      }),
    ).toEqual(d`
      /** Test */
      model Main {}

    `);
  });
  it("multi line doc comment", async () => {
    expect(
      await combineTo({
        "main.tsp": d`
        /**
         * Test
         */
        model Main {}
      `,
      }),
    ).toEqual(d`
      /**
       * Test
       */
      model Main {}

    `);
  });
});

it("emit diagnostic saying js files are not suppoorted", async () => {
  const result = await combine({
    "main.tsp": d`
      import "./foo.js";
      model Main {}
    `,
    "foo.js": mockFile.js({}),
  });
  expectDiagnostics(result.diagnostics, {
    code: "no-js",
    message: "Importer doesn't support JS files in project: /test/foo.js",
  });
  expect(result.content).toEqual(d`
    model Main {}

  `);
});
