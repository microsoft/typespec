import { createTester, expectDiagnostics, mockFile } from "@typespec/compiler/testing";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { $lib } from "../src/lib.js";
import {
  DIAGNOSTIC_DOCS_BASE_PATH,
  DIAGNOSTIC_DOCS_BASE_URL,
  DIAGNOSTIC_DOCS_EXCLUDED,
  EmitterOptionsSchema,
  LIB_NAME,
} from "../src/options.js";

describe("emitter options", () => {
  const tester = createTester(fileURLToPath(new URL("../..", import.meta.url)), {
    libraries: [],
  }).files({
    [`node_modules/${LIB_NAME}/package.json`]: JSON.stringify({ name: LIB_NAME, main: "index.js" }),
    [`node_modules/${LIB_NAME}/index.js`]: mockFile.js({
      $lib,
      $onEmit: () => {},
    }),
  });

  it("does not expose the Azure wrapper flavor option", () => {
    expect(EmitterOptionsSchema.properties).not.toHaveProperty("flavor");
  });

  it("does not expose an SSE developer option", () => {
    expect(EmitterOptionsSchema.properties["dev-options"]).not.toHaveProperty(
      "properties.enable-sse",
    );
  });

  it("accepts default unbranded emitter options", async () => {
    await tester.emit(LIB_NAME).compile("");
  });

  it("does not expose experimental annotations for unbranded clients", async () => {
    const [, diagnostics] = await tester
      .emit(LIB_NAME, {
        "experimental-annotation": "com.example.Preview",
      })
      .compileAndDiagnose("");
    expectDiagnostics(diagnostics, {
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
