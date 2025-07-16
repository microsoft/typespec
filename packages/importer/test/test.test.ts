import { resolvePath } from "@typespec/compiler";
import { createTester, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { ok } from "assert";
import { describe, expect, it } from "vitest";
import { combineProjectIntoFile } from "../src/importer.js";
import { d } from "./utils.js";

const Tester = createTester(resolvePath(import.meta.dirname, ".."), { libraries: [] });
describe("bundler", () => {
  async function combine(files: Record<string, string>) {
    const tester = await Tester.createInstance();
    for (const [name, content] of Object.entries(files)) {
      tester.fs.add(name, content);
    }
    return combineProjectIntoFile(tester.fs.compilerHost, "main.tsp");
  }

  async function combineTo(files: Record<string, string>): Promise<string> {
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
});
