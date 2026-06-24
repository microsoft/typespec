import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { expect, describe, it } from "vitest";
import { emitSingleSchemaWithDiagnostics } from "./test-host.js";

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
});
