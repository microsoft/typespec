import { expectDiagnosticEmpty, expectDiagnostics, t } from "@typespec/compiler/testing";
import { describe, it } from "vitest";
import { Tester } from "./test-host.js";

describe("$onValidate", () => {
  describe("empty-schema", () => {
    it("reports empty-schema when no GraphQL operations exist", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        @test namespace ${t.namespace("TestNamespace")} {
          model Book { title: string; }
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "@typespec/graphql/empty-schema",
        severity: "warning",
        message: "GraphQL schema has no operations. At minimum a Query root type is required.",
      });
    });

    it("does not report empty-schema when no @schema decorator", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        model Book { title: string; }
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("does not report empty-schema when @query operation exists", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        @test namespace ${t.namespace("TestNamespace")} {
          model Book { title: string; }
          @query op getBooks(): Book[];
        }
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("does not report empty-schema when @mutation operation exists", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        @test namespace ${t.namespace("TestNamespace")} {
          model Book { title: string; }
          @mutation op createBook(title: string): Book;
        }
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("does not report empty-schema when @subscription operation exists", async () => {
      const [_, diagnostics] = await Tester.compileAndDiagnose(t.code`
        @schema
        @test namespace ${t.namespace("TestNamespace")} {
          model Book { title: string; }
          @subscription op onBookCreated(): Book;
        }
      `);

      expectDiagnosticEmpty(diagnostics);
    });
  });
});
