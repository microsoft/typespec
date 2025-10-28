import { dereference } from "@scalar/openapi-parser";
import { OpenAPI } from "@scalar/openapi-types";
import { beforeAll, describe, expect, it } from "vitest";
import { TypeSpecModel } from "../../src/cli/actions/convert/interfaces.js";
import { transformComponentSchemas } from "../../src/cli/actions/convert/transforms/transform-component-schemas.js";
import { createContext } from "../../src/cli/actions/convert/utils/context.js";
import { OpenAPI3Document } from "../../src/types.js";

describe("tsp-openapi: transform component schemas", () => {
  let doc: OpenAPI.Document<{}>;

  beforeAll(async () => {
    const { specification } = await dereference({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/": {
          post: {
            requestBody: {
              content: {
                "multipart/form-data": {
                  schema: {
                    $ref: "#/components/schemas/MyModel",
                  },
                  encoding: {
                    id: { contentType: "text/plain" },
                    name: { contentType: "text/plain" },
                  },
                },
              },
            },
            responses: {
              "204": {
                description: "No Content",
              },
            },
          },
        },
      },
      components: {
        schemas: {
          MyModel: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
            description: "A test model",
          },
        },
      },
    });
    if (!specification) {
      throw new Error("Failed to dereference OpenAPI document");
    }
    doc = specification;
  });

  it("adds the encoding to the model when available", () => {
    const context = createContext(doc as OpenAPI3Document);
    context.registerMultipartSchema("#/components/schemas/MyModel", {
      id: { contentType: "text/plain" },
      name: { contentType: "text/plain" },
    });
    const models: TypeSpecModel[] = [];
    transformComponentSchemas(context, models);
    const model = models.find((m) => m.name === "MyModel");
    expect(model).toBeDefined();
    expect(model?.encoding).toBeDefined();
    expect(model?.isModelReferencedAsMultipartRequestBody).toBe(true);
  });
});
