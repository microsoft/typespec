import { strictEqual } from "node:assert";
import { describe, it } from "vitest";
import { emitSingleSchema } from "./test-host.js";
import { expect } from "vitest";

const expectedGraphQLSchema = `query { hello: String }`;

// input TSP lives in main.tsp
describe('name', () => {
  it("emit schema.graphql with two types Person and Book", async () => {
    const code = `
      @schema
      namespace TestNamespace {
        model Book {
          name: string;
          page_count: int32;
          published: boolean;
          price: float64;
        }
        model Author {
          name: string;
          books: Book[];
        }
        op getBooks(): Book[];
        op getAuthors(): Author[];
      }
    `;
    const emitterOptions = {}
    const results = await emitSingleSchema(code, emitterOptions);
    strictEqual(results, expectedGraphQLSchema);
  });
});