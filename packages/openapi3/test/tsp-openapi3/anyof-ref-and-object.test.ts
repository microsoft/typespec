import { dereference } from "@scalar/openapi-parser";
import { OpenAPI } from "@scalar/openapi-types";
import { beforeAll, describe, expect, it } from "vitest";
import { generateDataType } from "../../src/cli/actions/convert/generators/generate-model.js";
import { TypeSpecDataTypes, TypeSpecUnion } from "../../src/cli/actions/convert/interfaces.js";
import { transformComponentSchemas } from "../../src/cli/actions/convert/transforms/transform-component-schemas.js";
import { createContext } from "../../src/cli/actions/convert/utils/context.js";
import { OpenAPI3Document } from "../../src/types.js";

describe("tsp-openapi: anyOf with $ref and inline object should produce union", () => {
  let doc: OpenAPI.Document<{}>;

  beforeAll(async () => {
    const { specification } = await dereference({
      openapi: "3.1.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          VoiceIdsOrCustomVoice: {
            title: "Voice",
            description: "A built-in voice name or a custom voice reference.",
            anyOf: [
              { $ref: "#/components/schemas/VoiceIdsShared" },
              {
                type: "object",
                description: "Custom voice reference.",
                additionalProperties: false,
                required: ["id"],
                properties: {
                  id: { type: "string" },
                },
              },
            ],
          },
          VoiceIdsShared: {
            anyOf: [
              { type: "string" },
              {
                type: "string",
                enum: ["alloy", "ash", "ballad", "coral", "echo", "sage"],
              },
            ],
          },
        },
      },
    });
    if (!specification) {
      throw new Error("Failed to dereference OpenAPI document");
    }
    doc = specification;
  });

  it("should generate a union (not a model) for anyOf with $ref and inline object", () => {
    const context = createContext(doc as OpenAPI3Document);
    const types: TypeSpecDataTypes[] = [];
    transformComponentSchemas(context, types);

    const type = types.find((t) => t.name === "VoiceIdsOrCustomVoice");
    expect(type).toBeDefined();
    expect(type!.kind).toBe("union");
  });

  it("should generate TypeSpec union code containing both the ref and the inline object", () => {
    const context = createContext(doc as OpenAPI3Document);
    const types: TypeSpecDataTypes[] = [];
    transformComponentSchemas(context, types);

    const union = types.find(
      (t) => t.name === "VoiceIdsOrCustomVoice" && t.kind === "union",
    ) as TypeSpecUnion;
    expect(union).toBeDefined();

    const generatedCode = generateDataType(union, context);

    // Should be a union, not a model
    expect(generatedCode).toContain("union VoiceIdsOrCustomVoice");
    expect(generatedCode).not.toContain("model VoiceIdsOrCustomVoice");
    // Should reference the VoiceIdsShared type
    expect(generatedCode).toContain("VoiceIdsShared");
  });

  it("should preserve description from parent schema on the union", () => {
    const context = createContext(doc as OpenAPI3Document);
    const types: TypeSpecDataTypes[] = [];
    transformComponentSchemas(context, types);

    const union = types.find(
      (t) => t.name === "VoiceIdsOrCustomVoice" && t.kind === "union",
    ) as TypeSpecUnion;
    expect(union).toBeDefined();
    expect(union.doc).toContain("A built-in voice name or a custom voice reference.");
  });
});
