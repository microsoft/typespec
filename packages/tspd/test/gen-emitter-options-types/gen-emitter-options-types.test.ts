import { resolvePath } from "@typespec/compiler";
import { createTester, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { expect, it } from "vitest";
import { generateEmitterOptionsType } from "../../src/gen-emitter-options-types/gen-emitter-options-types.js";

const Tester = createTester(resolvePath(import.meta.dirname, "../.."), {
  libraries: [],
});

async function generateOptions(code: string) {
  const [{ program }] = await Tester.compileAndDiagnose(code, {
    compilerOptions: {
      parseOptions: { comments: true, docs: true },
    },
  });
  expectDiagnosticEmpty(program.diagnostics);

  const emitterOptions = program.getGlobalNamespaceType().models.get("EmitterOptions");
  expect(emitterOptions).toBeDefined();
  return generateEmitterOptionsType(program, emitterOptions!, {
    interfaceName: "TestEmitterOptions",
    prettierConfig: { plugins: [] },
  });
}

it("maps emitter options model to a TypeScript interface", async () => {
  const result = await generateOptions(`
    scalar absolutePath extends string;
    enum Format { yaml, json }

    /**
     * Test emitter options.
     */
    model EmitterOptions {
      /**
       * File type.
       */
      \`file-type\`?: Format | Format[];

      /**
       * Numeric value.
       */
      count: int32;

      /**
       * Custom string scalar.
       */
      path?: absolutePath;

      /**
       * Byte payload.
       */
      payload?: bytes;

      /**
       * String-indexed metadata.
       */
      metadata?: Record<boolean>;

      /**
       * Nested object.
       */
      nested?: {
        /**
         * Strategy kind.
         */
        kind: "parent" | "fqn";

        /**
         * Optional separator.
         */
        separator?: string;
      };
    }
  `);

  expect(result.trim()).toEqual(
    `
/**
 * Test emitter options.
 */
export interface TestEmitterOptions {
  /**
   * File type.
   */
  "file-type"?: "yaml" | "json" | ("yaml" | "json")[];
  /**
   * Numeric value.
   */
  count: number;
  /**
   * Custom string scalar.
   */
  path?: string;
  /**
   * Byte payload.
   */
  payload?: Uint8Array;
  /**
   * String-indexed metadata.
   */
  metadata?: Record<string, boolean>;
  /**
   * Nested object.
   */
  nested?: {
    /**
     * Strategy kind.
     */
    kind: "parent" | "fqn";
    /**
     * Optional separator.
     */
    separator?: string;
  };
}
`.trim(),
  );
});
