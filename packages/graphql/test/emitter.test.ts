import { strictEqual } from "node:assert";
import { describe, it } from "vitest";
import { emitSingleSchema } from "./test-host.js";

// For now, the expected output is a placeholder string.
// In the future, this should be replaced with the actual GraphQL schema output.
const expectedGraphQLSchema = `type Query {
  """
  A placeholder field. If you are seeing this, it means no operations were defined that could be emitted.
  """
  _: Boolean
}`;

describe("name", () => {
  it("Emits a schema.graphql file with placeholder text", async () => {
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
    const results = await emitSingleSchema(code, {});
    strictEqual(results, expectedGraphQLSchema);
  });
});
