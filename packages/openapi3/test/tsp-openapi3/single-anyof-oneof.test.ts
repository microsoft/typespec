import OpenAPIParser from "@scalar/openapi-parser";
import { OpenAPI } from "@scalar/openapi-types";
import { beforeAll, describe, expect, it } from "vitest";
import { generateDataType } from "../../src/cli/actions/convert/generators/generate-model.js";
import { TypeSpecDataTypes, TypeSpecModel } from "../../src/cli/actions/convert/interfaces.js";
import { transformComponentSchemas } from "../../src/cli/actions/convert/transforms/transform-component-schemas.js";
import { createContext } from "../../src/cli/actions/convert/utils/context.js";
import { OpenAPI3Document } from "../../src/types.js";

describe("tsp-openapi: single anyOf/oneOf inline schema should produce model", () => {
  let parser: OpenAPIParser;
  let doc: OpenAPI.Document<{}>;

  beforeAll(async () => {
    parser = new OpenAPIParser();
    doc = await parser.bundle({
      openapi: "3.1.0",
      info: { title: "repro API", version: "1.0.0", description: "API for repro" },
      servers: [{ url: "http://localhost:3000" }],
      paths: {},
      components: {
        schemas: {
          ChatCompletionStreamOptions: {
            anyOf: [
              {
                description: "options",
                type: "object",
                properties: {
                  include_usage: {
                    type: "boolean",
                    description: "usage",
                  },
                  include_obfuscation: {
                    type: "boolean",
                    description: "obfuscation",
                  },
                },
              },
            ],
          },
          OneOfSingleSchema: {
            oneOf: [
              {
                description: "Single schema in oneOf",
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Name field",
                  },
                },
              },
            ],
          },
          AnyOfSingleSchemaWithNull: {
            anyOf: [
              {
                description: "Single schema with null",
                type: "object",
                properties: {
                  value: {
                    type: "string",
                  },
                },
              },
              {
                type: "null",
              },
            ],
          },
          OneOfSingleSchemaWithNull: {
            oneOf: [
              {
                description: "Single oneOf schema with null",
                type: "object",
                properties: {
                  id: {
                    type: "integer",
                  },
                },
              },
              {
                type: "null",
              },
            ],
          },
        },
      },
    });
  });

  it("should generate a model for anyOf with single inline schema", () => {
    const context = createContext(parser, doc as OpenAPI3Document);
    const types: TypeSpecDataTypes[] = [];
    transformComponentSchemas(context, types);

    const type = types.find((t) => t.name === "ChatCompletionStreamOptions");
    expect(type).toBeDefined();
    expect(type!.kind).toBe("model");

    if (type!.kind === "model") {
      const model = type as TypeSpecModel;
      expect(model.doc).toBe("options");
      expect(model.properties).toHaveLength(2);
      expect(model.properties.find((p) => p.name === "include_usage")).toBeDefined();
      expect(model.properties.find((p) => p.name === "include_obfuscation")).toBeDefined();

      // Generate the actual TypeSpec code
      const generatedCode = generateDataType(model, context);
      expect(generatedCode).toContain("model ChatCompletionStreamOptions");
      expect(generatedCode).toContain("include_usage");
      expect(generatedCode).toContain("include_obfuscation");
      expect(generatedCode).not.toContain("union");
    }
  });

  it("should generate a model for oneOf with single inline schema", () => {
    const context = createContext(parser, doc as OpenAPI3Document);
    const types: TypeSpecDataTypes[] = [];
    transformComponentSchemas(context, types);

    const type = types.find((t) => t.name === "OneOfSingleSchema");
    expect(type).toBeDefined();
    expect(type!.kind).toBe("model");

    if (type!.kind === "model") {
      const model = type as TypeSpecModel;
      expect(model.doc).toBe("Single schema in oneOf");
      expect(model.properties).toHaveLength(1);
      expect(model.properties.find((p) => p.name === "name")).toBeDefined();
    }
  });

  it("should generate a model for anyOf with single inline schema + null", () => {
    const context = createContext(parser, doc as OpenAPI3Document);
    const types: TypeSpecDataTypes[] = [];
    transformComponentSchemas(context, types);

    const type = types.find((t) => t.name === "AnyOfSingleSchemaWithNull");
    expect(type).toBeDefined();
    expect(type!.kind).toBe("model");

    if (type!.kind === "model") {
      const model = type as TypeSpecModel;
      expect(model.doc).toBe("Single schema with null");
      expect(model.properties).toHaveLength(1);
      expect(model.properties.find((p) => p.name === "value")).toBeDefined();

      // The model should be nullable (via OpenAPI 3.0 nullable: true or OpenAPI 3.1 type: null handling)
      // This will be handled by the nullable property in the schema
    }
  });

  it("should generate a model for oneOf with single inline schema + null", () => {
    const context = createContext(parser, doc as OpenAPI3Document);
    const types: TypeSpecDataTypes[] = [];
    transformComponentSchemas(context, types);

    const type = types.find((t) => t.name === "OneOfSingleSchemaWithNull");
    expect(type).toBeDefined();
    expect(type!.kind).toBe("model");

    if (type!.kind === "model") {
      const model = type as TypeSpecModel;
      expect(model.doc).toBe("Single oneOf schema with null");
      expect(model.properties).toHaveLength(1);
      expect(model.properties.find((p) => p.name === "id")).toBeDefined();
    }
  });
});
