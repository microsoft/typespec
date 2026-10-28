import { compile, NodeHost } from "@typespec/compiler";
import { expectDiagnostics } from "@typespec/compiler/testing";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { $lib } from "../src/lib.js";
import {
  DIAGNOSTIC_DOCS_BASE_PATH,
  DIAGNOSTIC_DOCS_BASE_URL,
  DIAGNOSTIC_DOCS_EXCLUDED,
} from "../src/options.js";

describe("emitter options", () => {
  it("does not expose experimental annotations for unbranded clients", async () => {
    const program = await compile(
      NodeHost,
      fileURLToPath(new URL("./fixtures/experimental.tsp", import.meta.url)),
      {
        outputDir: fileURLToPath(new URL("../temp/unbranded-experimental", import.meta.url)),
        emit: ["@typespec/http-client-java"],
        options: {
          "@typespec/http-client-java": {
            "experimental-annotation": "com.example.Preview",
          },
        },
      },
    );
    expectDiagnostics(program.diagnostics, {
      code: "invalid-schema",
      severity: "error",
      message:
        "Schema violation: must NOT have additional properties (/)\n  additionalProperty: experimental-annotation",
    });
  });
});

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
