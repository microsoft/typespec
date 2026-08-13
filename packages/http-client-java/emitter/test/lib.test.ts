import { describe, expect, it } from "vitest";
import { $lib } from "../src/lib.js";
import {
  DIAGNOSTIC_DOCS_BASE_PATH,
  DIAGNOSTIC_DOCS_BASE_URL,
  DIAGNOSTIC_DOCS_EXCLUDED,
  EmitterOptionsSchema,
} from "../src/options.js";

describe("diagnostic documentation", () => {
  it("links documented diagnostics to their documentation", () => {
    const undocumentedDiagnostics = new Set([
      "unknown-error",
      "generator-error",
      "generator-warning",
      ...DIAGNOSTIC_DOCS_EXCLUDED,
    ]);

    for (const [code, diagnostic] of Object.entries($lib.diagnostics)) {
      const definition = diagnostic as {
        docs?: { kind: string; path: string };
        url?: string;
      };

      if (undocumentedDiagnostics.has(code)) {
        expect(definition.docs).toBeUndefined();
        expect(definition.url).toBeUndefined();
      } else {
        expect(definition.docs).toEqual({
          kind: "file-ref",
          path: `${DIAGNOSTIC_DOCS_BASE_PATH}/${code}.md`,
        });
        expect(definition.url).toBe(`${DIAGNOSTIC_DOCS_BASE_URL}/${code}`);
      }
    }
  });
});

describe("emitter options", () => {
  it("defines remove-model as an array of model names", () => {
    expect(EmitterOptionsSchema.properties?.["remove-model"]).toEqual({
      type: "array",
      description: "Model names to remove from the generated management client.",
      items: { type: "string" },
      nullable: true,
    });
  });
});
