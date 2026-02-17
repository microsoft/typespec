import { describe, it } from "vitest";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: internal modifier", () => {
  describe("modifier validation", () => {
    const declarationKinds = [
      { keyword: "model", code: "internal model Foo {}" },
      { keyword: "scalar", code: "internal scalar Foo;" },
      { keyword: "interface", code: "internal interface Foo {}" },
      { keyword: "union", code: "internal union Foo {}" },
      { keyword: "op", code: "internal op foo(): void;" },
      { keyword: "enum", code: "internal enum Foo {}" },
      { keyword: "alias", code: "internal alias Foo = string;" },
      { keyword: "const", code: "internal const foo = 1;" },
    ];

    for (const { keyword, code } of declarationKinds) {
      it(`allows 'internal' on ${keyword} declaration (with experimental warning)`, async () => {
        const diagnostics = await Tester.diagnose(code);
        expectDiagnostics(diagnostics, {
          code: "experimental-internal",
          severity: "warning",
          message:
            "The 'internal' modifier is experimental and may change or be removed in future releases.",
        });
      });
    }

    it("allows 'internal' combined with 'extern' on decorator declaration", async () => {
      const diagnostics = await Tester.files({
        "test.js": { kind: "js", exports: { $myDec: () => {} } },
      })
        .import("./test.js")
        .diagnose(`internal extern dec myDec(target: unknown);`);

      // Only the experimental warning, no error
      expectDiagnostics(diagnostics, {
        code: "experimental-internal",
      });
    });

    it("does not allow 'internal' on namespace", async () => {
      const diagnostics = await Tester.diagnose(`internal namespace Foo {}`);
      expectDiagnostics(diagnostics, [
        {
          code: "experimental-internal",
        },
        {
          code: "invalid-modifier",
          message: "Modifier 'internal' cannot be used on declarations of type 'namespace'.",
        },
      ]);
    });

    it("does not allow 'internal' on blockless namespace", async () => {
      const diagnostics = await Tester.diagnose(`internal namespace Foo;`);
      expectDiagnostics(diagnostics, [
        {
          code: "experimental-internal",
        },
        {
          code: "invalid-modifier",
          message: "Modifier 'internal' cannot be used on declarations of type 'namespace'.",
        },
      ]);
    });

    it("does not emit experimental warning without 'internal' modifier", async () => {
      const diagnostics = await Tester.diagnose(`model Foo {}`);
      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("access control", () => {
    function createLibraryTester(libFiles: Record<string, string>) {
      const files: Record<string, string> = {
        "node_modules/my-lib/package.json": JSON.stringify({
          name: "my-lib",
          version: "1.0.0",
          exports: { ".": { typespec: "./main.tsp" } },
        }),
      };
      for (const [name, content] of Object.entries(libFiles)) {
        files[`node_modules/my-lib/${name}`] = content;
      }
      return Tester.files(files);
    }

    describe("cross-library access (should fail)", () => {
      it("rejects access to internal model from another package", async () => {
        const diagnostics = await createLibraryTester({
          "main.tsp": "internal model LibModel {}",
        }).diagnose(`
          import "my-lib";
          model Consumer { x: LibModel }
        `);

        expectDiagnostics(diagnostics, [
          { code: "invalid-ref", message: /internal/ },
          { code: "experimental-internal" },
        ]);
      });

      it("rejects access to internal scalar from another package", async () => {
        const diagnostics = await createLibraryTester({
          "main.tsp": "internal scalar LibScalar;",
        }).diagnose(`
          import "my-lib";
          model Consumer { x: LibScalar }
        `);

        expectDiagnostics(diagnostics, [
          { code: "invalid-ref", message: /internal/ },
          { code: "experimental-internal" },
        ]);
      });

      it("rejects access to internal interface from another package", async () => {
        const diagnostics = await createLibraryTester({
          "main.tsp": "internal interface LibIface {}",
        }).diagnose(`
          import "my-lib";
          interface Consumer extends LibIface {}
        `);

        expectDiagnostics(diagnostics, [
          { code: "invalid-ref", message: /internal/ },
          { code: "experimental-internal" },
        ]);
      });

      it("rejects access to internal union from another package", async () => {
        const diagnostics = await createLibraryTester({
          "main.tsp": "internal union LibUnion {}",
        }).diagnose(`
          import "my-lib";
          model Consumer { x: LibUnion }
        `);

        expectDiagnostics(diagnostics, [
          { code: "invalid-ref", message: /internal/ },
          { code: "experimental-internal" },
        ]);
      });

      it("rejects access to internal op from another package", async () => {
        const diagnostics = await createLibraryTester({
          "main.tsp": "internal op libOp(): void;",
        }).diagnose(`
          import "my-lib";
          op consumer is libOp;
        `);

        expectDiagnostics(diagnostics, [
          { code: "invalid-ref", message: /internal/ },
          { code: "experimental-internal" },
        ]);
      });

      it("rejects access to internal enum from another package", async () => {
        const diagnostics = await createLibraryTester({
          "main.tsp": "internal enum LibEnum { a, b }",
        }).diagnose(`
          import "my-lib";
          model Consumer { x: LibEnum }
        `);

        expectDiagnostics(diagnostics, [
          { code: "invalid-ref", message: /internal/ },
          { code: "experimental-internal" },
        ]);
      });

      it("rejects access to internal alias from another package", async () => {
        const diagnostics = await createLibraryTester({
          "main.tsp": `
            model Impl {}
            internal alias LibAlias = Impl;
          `,
        }).diagnose(`
          import "my-lib";
          model Consumer { x: LibAlias }
        `);

        expectDiagnostics(diagnostics, [
          { code: "invalid-ref", message: /internal/ },
          { code: "experimental-internal" },
        ]);
      });

      it("rejects access to internal model in a namespace from another package", async () => {
        const diagnostics = await createLibraryTester({
          "main.tsp": `
            namespace MyLib;
            internal model Secret {}
          `,
        }).diagnose(`
          import "my-lib";
          model Consumer { x: MyLib.Secret }
        `);

        expectDiagnostics(diagnostics, [
          { code: "invalid-ref", message: /internal/ },
          { code: "experimental-internal" },
        ]);
      });

      it("rejects access to internal model via 'using' from another package", async () => {
        const diagnostics = await createLibraryTester({
          "main.tsp": `
            namespace MyLib;
            internal model Secret {}
          `,
        }).diagnose(`
          import "my-lib";
          using MyLib;
          model Consumer { x: Secret }
        `);

        expectDiagnostics(diagnostics, [
          { code: "invalid-ref", message: /internal/ },
          { code: "experimental-internal" },
        ]);
      });

      it("rejects extending an internal model from another package", async () => {
        const diagnostics = await createLibraryTester({
          "main.tsp": "internal model Base { x: string }",
        }).diagnose(`
          import "my-lib";
          model Consumer extends Base {}
        `);

        expectDiagnostics(diagnostics, [
          { code: "invalid-ref", message: /internal/ },
          { code: "experimental-internal" },
        ]);
      });
    });

    describe("same-project access (should succeed)", () => {
      it("allows access to internal model within the same project", async () => {
        const diagnostics = await Tester.diagnose(`
          internal model Secret {}
          model Consumer { x: Secret }
        `);

        // Only the experimental warning, no access error
        expectDiagnostics(diagnostics, { code: "experimental-internal" });
      });

      it("allows access to internal enum within the same project", async () => {
        const diagnostics = await Tester.diagnose(`
          internal enum Status { active, inactive }
          model Consumer { x: Status }
        `);

        expectDiagnostics(diagnostics, { code: "experimental-internal" });
      });

      it("allows access to internal model across files in the same project", async () => {
        const [, diagnostics] = await Tester.compileAndDiagnose({
          "main.tsp": `
            import "./other.tsp";
            model Consumer { x: Secret }
          `,
          "other.tsp": `
            internal model Secret {}
          `,
        });

        expectDiagnostics(diagnostics, { code: "experimental-internal" });
      });

      it("allows access to internal op within the same project", async () => {
        const diagnostics = await Tester.diagnose(`
          internal op helper(): void;
          op consumer is helper;
        `);

        expectDiagnostics(diagnostics, { code: "experimental-internal" });
      });

      it("allows access to internal scalar within the same project", async () => {
        const diagnostics = await Tester.diagnose(`
          internal scalar MyScalar;
          model Consumer { x: MyScalar }
        `);

        expectDiagnostics(diagnostics, { code: "experimental-internal" });
      });

      it("allows access to internal alias within the same project", async () => {
        const diagnostics = await Tester.diagnose(`
          internal alias Shorthand = string;
          model Consumer { x: Shorthand }
        `);

        expectDiagnostics(diagnostics, { code: "experimental-internal" });
      });
    });

    describe("same-library access (should succeed)", () => {
      it("allows access to internal model within the same library", async () => {
        const diagnostics = await createLibraryTester({
          "main.tsp": `
            import "./helper.tsp";
            model Public { x: InternalHelper }
          `,
          "helper.tsp": `
            internal model InternalHelper {}
          `,
        }).diagnose(`
          import "my-lib";
          model Consumer { x: Public }
        `);

        // experimental-internal for InternalHelper in the library, no access error
        expectDiagnostics(diagnostics, { code: "experimental-internal" });
      });
    });

    describe("public symbols from library (should succeed)", () => {
      it("allows access to non-internal model from another package", async () => {
        const diagnostics = await createLibraryTester({
          "main.tsp": "model PublicModel {}",
        }).diagnose(`
          import "my-lib";
          model Consumer { x: PublicModel }
        `);

        expectDiagnosticEmpty(diagnostics);
      });

      it("allows access to non-internal model in a namespace from another package", async () => {
        const diagnostics = await createLibraryTester({
          "main.tsp": `
            namespace MyLib;
            model PublicModel {}
          `,
        }).diagnose(`
          import "my-lib";
          model Consumer { x: MyLib.PublicModel }
        `);

        expectDiagnosticEmpty(diagnostics);
      });
    });
  });
});
