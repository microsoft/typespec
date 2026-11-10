import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { EmitterTester, emitSingleSchemaWithDiagnostics } from "./test-host.js";

describe("emitter", () => {
  it("emits a schema with query operations", async () => {
    const code = `
      @schema
      namespace TestNamespace {
        model Book {
          title: string;
          pageCount: int32;
        }
        @query op getBooks(): Book[];
      }
    `;
    const result = await emitSingleSchemaWithDiagnostics(code, {});
    expectDiagnosticEmpty(result.diagnostics);
    expect(result.graphQLOutput).toBeDefined();
    expect(result.graphQLOutput).toMatch(/type Query \{/);
    expect(result.graphQLOutput).toContain("getBooks");
    expect(result.graphQLOutput).toMatch(/type Book \{/);
    expect(result.graphQLOutput).toContain("title: String!");
    expect(result.graphQLOutput).toContain("pageCount: Int!");
  });

  it("emits mutation and subscription root types", async () => {
    const code = `
      @schema
      namespace TestNamespace {
        model Book { title: string; }
        @query op getBooks(): Book[];
        @mutation op createBook(title: string): Book;
        @subscription op onBookCreated(): Book;
      }
    `;
    const result = await emitSingleSchemaWithDiagnostics(code, {});
    expect(result.graphQLOutput).toBeDefined();
    expect(result.graphQLOutput).toMatch(/type Query \{/);
    expect(result.graphQLOutput).toMatch(/type Mutation \{/);
    expect(result.graphQLOutput).toMatch(/type Subscription \{/);
  });

  it("emits enums and scalars referenced by models", async () => {
    const code = `
      @schema
      namespace TestNamespace {
        enum Status { Active, Inactive }
        scalar DateTime extends string;
        model Book { title: string; status: Status; created: DateTime; }
        @query op getBooks(): Book[];
      }
    `;
    const result = await emitSingleSchemaWithDiagnostics(code, {});
    expect(result.graphQLOutput).toBeDefined();
    expect(result.graphQLOutput).toMatch(/enum Status \{/);
    expect(result.graphQLOutput).toContain("scalar DateTime");
  });

  it("emits input types for operation parameters", async () => {
    const code = `
      @schema
      namespace TestNamespace {
        model Book { title: string; }
        @query op getBooks(): Book[];
        @mutation op createBook(input: Book): Book;
      }
    `;
    const result = await emitSingleSchemaWithDiagnostics(code, {});
    expect(result.graphQLOutput).toBeDefined();
    expect(result.graphQLOutput).toMatch(/type Book \{/);
    expect(result.graphQLOutput).toMatch(/input BookInput \{/);
  });

  it("sanitizes schema names used in output paths", async () => {
    const result = await EmitterTester.compile(
      `
        @schema(#{ name: "../../outside/schema" })
        namespace TestNamespace {
          @query op ping(): string;
        }
      `,
      {
        compilerOptions: {
          options: {
            "@typespec/graphql": { "output-file": "{schema-name}.graphql" },
          },
        },
      },
    );

    expect(result.outputs).toHaveProperty(".._.._outside_schema.graphql");
    expect(result.outputs).not.toHaveProperty("../../outside/schema.graphql");
  });

  it("reports schema names that resolve to the same output path", async () => {
    const [result, diagnostics] = await EmitterTester.compileAndDiagnose(
      `
        @schema(#{ name: "a/b" })
        namespace First {
          @query op first(): string;
        }

        @schema(#{ name: "a_b" })
        namespace Second {
          @query op second(): string;
        }
      `,
      {
        compilerOptions: {
          options: {
            "@typespec/graphql": { "output-file": "{schema-name}.graphql" },
          },
        },
      },
    );

    expectDiagnostics(diagnostics, {
      code: "@typespec/graphql/output-file-collision",
      message: 'Multiple GraphQL schemas resolve to the output file "a_b.graphql".',
    });
    expect(Object.keys(result.outputs)).toEqual(["a_b.graphql"]);
  });

  it("reports output collisions that occur on case-insensitive file systems", async () => {
    const [, diagnostics] = await EmitterTester.compileAndDiagnose(
      `
        @schema(#{ name: "Api" })
        namespace First {
          @query op first(): string;
        }

        @schema(#{ name: "api" })
        namespace Second {
          @query op second(): string;
        }
      `,
      {
        compilerOptions: {
          options: {
            "@typespec/graphql": { "output-file": "{schema-name}.graphql" },
          },
        },
      },
    );

    expectDiagnostics(diagnostics, {
      code: "@typespec/graphql/output-file-collision",
      message: 'Multiple GraphQL schemas resolve to the output file "api.graphql".',
    });
  });
});
