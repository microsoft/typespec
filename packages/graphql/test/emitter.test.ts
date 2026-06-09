import { describe, it } from "vitest";
import { emitSingleSchemaWithDiagnostics } from "./test-host.js";

describe("emitter", () => {
  it("runs the mutation pipeline without errors", async () => {
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
    const result = await emitSingleSchemaWithDiagnostics(code, {});
    // Rendering is a stub — no output expected yet.
    // This test verifies the pipeline (type-usage → mutation → buildTypeGraph) completes.
    // Output assertions will be added when the Schema orchestrator component lands.
    result; // no-op, just ensure no throw
  });
});
