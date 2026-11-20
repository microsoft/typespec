import { describe, expect, it, vi } from "vitest";
import { generateDecorators } from "../../src/cli/actions/convert/generators/generate-decorators.js";
import { createContext } from "../../src/cli/actions/convert/utils/context.js";
import { getDecoratorsForSchema } from "../../src/cli/actions/convert/utils/decorators.js";
import { convertOpenAPI3Document } from "../../src/index.js";
import type { OpenAPIDocument3_2, OpenAPISchema3_2 } from "../../src/types.js";
import { ApiTester } from "../test-host.js";

async function emitOpenAPI(code: string) {
  const { outputs } = await ApiTester.emit("@typespec/openapi3").compile(code, {
    compilerOptions: {
      options: {
        "@typespec/openapi3": {
          "openapi-versions": ["3.2.0"],
          "output-file": "openapi.json",
        },
      },
    },
  });
  return JSON.parse(outputs["openapi.json"]);
}

function documentFor(schema: OpenAPISchema3_2): OpenAPIDocument3_2 {
  return {
    openapi: "3.2.0",
    info: { title: "Pets", version: "1" },
    paths: {},
    components: { schemas: { Pet: schema } },
  };
}

describe("import schema examples", () => {
  it("creates example decorators in reverse order without mutating the input", () => {
    const schema: OpenAPISchema3_2 = {
      type: "object",
      examples: [{ name: "Fluffy" }, { name: "Spot" }, { name: "Mochi" }],
    };
    expect(generateDecorators(getDecoratorsForSchema(schema))).toEqual([
      '@example(#{name: "Mochi"})',
      '@example(#{name: "Spot"})',
      '@example(#{name: "Fluffy"})',
    ]);
    expect(schema.examples).toEqual([{ name: "Fluffy" }, { name: "Spot" }, { name: "Mochi" }]);
  });

  it("preserves duplicate examples", () => {
    expect(
      generateDecorators(getDecoratorsForSchema({ type: "string", examples: ["pet", "pet"] })),
    ).toEqual(['@example("pet")', '@example("pet")']);
  });

  it("serializes JSON values using TypeSpec value syntax", () => {
    expect(
      generateDecorators(
        getDecoratorsForSchema({
          examples: [null, false, 0, "a${b}", [], {}, { "pet-name": [1, null, true] }],
        }),
      ),
    ).toEqual([
      "@example(#{`pet-name`: #[1, null, true]})",
      "@example(#{})",
      "@example(#[])",
      '@example("a\\${b}")',
      "@example(0)",
      "@example(false)",
      "@example(null)",
    ]);
  });

  const ignoredSchemas = [
    { name: "absent", schema: { type: "string" }, warns: false },
    { name: "empty", schema: { type: "string", examples: [] }, warns: false },
    { name: "invalid", schema: { type: "string", examples: "pet" }, warns: true },
    { name: "null", schema: { type: "string", examples: null }, warns: true },
    { name: "singular", schema: { type: "string", example: "pet" }, warns: false },
  ] as const;

  it.each(ignoredSchemas)("ignores $name examples", ({ schema, warns }) => {
    const warn = vi.fn();
    const context = createContext(documentFor({}), { trace: vi.fn(), warn, error: vi.fn() });
    expect(getDecoratorsForSchema(schema as OpenAPISchema3_2, context)).toEqual([]);
    if (warns) {
      expect(warn).toHaveBeenCalledWith(
        "Schema examples must be an array. The examples will be ignored.",
      );
    } else {
      expect(warn).not.toHaveBeenCalled();
    }
  });

  it.each(ignoredSchemas)(
    "converts and compiles schemas with $name examples without decorators",
    async ({ schema, warns }) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const code = await convertOpenAPI3Document(documentFor(schema as OpenAPISchema3_2));
        expect(code).not.toContain("@example");
        const output = await emitOpenAPI(code);
        expect(output.components.schemas.Pet).not.toHaveProperty("examples");
        expect(output.components.schemas.Pet).not.toHaveProperty("example");
        expect(warn).toHaveBeenCalledTimes(warns ? 1 : 0);
      } finally {
        warn.mockRestore();
      }
    },
  );

  it.each([
    { examples: [{ name: "Fluffy" }] },
    { examples: [{ name: "Fluffy" }, { name: "Spot" }, { name: "Mochi" }] },
    { examples: [{ name: "Fluffy" }, { name: "Fluffy" }] },
  ])("round-trips model examples $examples in their original order", async ({ examples }) => {
    const code = await convertOpenAPI3Document(
      documentFor({
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" } },
        examples,
      }),
    );
    const output = await emitOpenAPI(code);
    expect(output.components.schemas.Pet.examples).toEqual(examples);
    expect(output.components.schemas.Pet).not.toHaveProperty("example");
  });

  it("round-trips examples on properties and scalar, array, and union schemas", async () => {
    const schemas: Record<string, OpenAPISchema3_2> = {
      PetName: { type: "string", examples: ["Fluffy", "Spot"] },
      PetNames: { type: "array", items: { type: "string" }, examples: [[], ["Fluffy"]] },
      MaybePet: { type: ["string", "null"], examples: [null, "Fluffy"] },
      Pet: {
        type: "object",
        properties: { name: { type: "string", examples: ["Fluffy", "Spot", "Fluffy"] } },
      },
    };
    const input = documentFor({});
    input.components = { schemas };
    const code = await convertOpenAPI3Document(input);
    const output = await emitOpenAPI(code);
    for (const name of ["PetName", "PetNames", "MaybePet"]) {
      expect(output.components.schemas[name].examples).toEqual(schemas[name].examples);
    }
    expect(output.components.schemas.Pet.properties.name.examples).toEqual([
      "Fluffy",
      "Spot",
      "Fluffy",
    ]);
  });

  it("preserves outer examples without merging nullable union member examples", async () => {
    const examples = [null, "Fluffy"];
    const code = await convertOpenAPI3Document(
      documentFor({
        anyOf: [{ type: "string", examples: ["Spot"] }, { type: "null" }],
        examples,
      }),
    );
    const output = await emitOpenAPI(code);
    expect(output.components.schemas.Pet.examples).toEqual(examples);
  });

  it("warns about invalid examples on a model property", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const code = await convertOpenAPI3Document(
        documentFor({
          type: "object",
          properties: {
            name: { type: "string", examples: "invalid" } as unknown as OpenAPISchema3_2,
          },
        }),
      );
      expect(code).not.toContain("@example");
      await emitOpenAPI(code);
      expect(warn).toHaveBeenCalledWith(
        "Schema examples must be an array. The examples will be ignored.",
      );
    } finally {
      warn.mockRestore();
    }
  });
});
