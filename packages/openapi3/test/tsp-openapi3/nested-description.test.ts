import { describe, expect, it } from "vitest";
import { renderTypeSpecForOpenAPI3 } from "./utils/tsp-for-openapi3.js";

describe("nested property descriptions", () => {
  it("generates doc comments from nested property descriptions", async () => {
    const tsp = await renderTypeSpecForOpenAPI3({
      paths: {
        "/": {
          get: {
            operationId: "extensive",
            parameters: [],
            responses: {
              "200": {
                description: "The request has succeeded.",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Dog",
                    },
                  },
                },
              },
              "4XX": {
                description: "Client error",
              },
              "5XX": {
                description: "Server error",
              },
            },
          },
        },
      },
      schemas: {
        Dog: {
          properties: {
            top_level: {
              type: "object",
              description: "This is a top level property description.",
              properties: {
                nested: {
                  type: "object",
                  description: "This is a nested property description.",
                  properties: {
                    deep_nested: {
                      type: "string",
                      description: "This is a deep nested property description.",
                    },
                  },
                  required: ["deep_nested"],
                },
              },
              required: ["nested"],
            },
            first_id: {
              type: "string",
              example: "msg_abc123",
            },
            last_id: {
              type: "string",
              example: "msg_abc123",
            },
            has_more: {
              type: "boolean",
              example: false,
            },
          },
          required: ["first_id", "last_id", "top_level"],
        },
      },
    });

    expect(tsp).toMatchInlineSnapshot(`
"import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "Test Service" })
@info(#{ version: "1.0.0" })
namespace TestService;

model Dog {
  /** This is a top level property description. */
  top_level: {
    /** This is a nested property description. */
    nested: {
      /** This is a deep nested property description. */
      deep_nested: string;
    };
  };

  first_id: string;
  last_id: string;
  has_more?: boolean;
}

@route("/") @get op extensive(): Dog | {
  @statusCode
  @minValue(400)
  @maxValue(499)
  statusCode: int32;
} | {
  @statusCode
  @minValue(500)
  @maxValue(599)
  statusCode: int32;
};
"
    `);
  });
});
