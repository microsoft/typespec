import { getDocData, Numeric } from "@typespec/compiler";
import { ok } from "assert";
import { assert, describe, expect, it } from "vitest";
import { expectDecorators } from "./utils/expect.js";
import {
  compileForOpenAPI3,
  renderTypeSpecForOpenAPI3,
  tspForOpenAPI3,
} from "./utils/tsp-for-openapi3.js";

describe("$ref with sibling keywords", () => {
  describe("parameter with $ref and default", () => {
    it("should handle default value on $ref parameter", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        schemas: {
          OrderEnum: {
            type: "string",
            enum: ["asc", "desc"],
          },
        },
        paths: {
          "/foo": {
            get: {
              operationId: "getFoo",
              parameters: [
                {
                  name: "order",
                  in: "query",
                  schema: {
                    $ref: "#/components/schemas/OrderEnum",
                    default: "desc",
                  } as any,
                },
              ],
              responses: {
                "200": { description: "Success" },
              },
            },
          },
        },
      });

      // Should contain default value reference to enum member
      expect(tsp).toContain("order?: OrderEnum = OrderEnum.desc");
    });

    it("should handle default value with string type", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        schemas: {
          StringType: {
            type: "string",
          },
        },
        paths: {
          "/foo": {
            get: {
              operationId: "getFoo",
              parameters: [
                {
                  name: "name",
                  in: "query",
                  schema: {
                    $ref: "#/components/schemas/StringType",
                    default: "default-name",
                  } as any,
                },
              ],
              responses: {
                "200": { description: "Success" },
              },
            },
          },
        },
      });

      // Should contain default value
      expect(tsp).toContain('name?: StringType = "default-name"');
    });
  });

  describe("parameter with $ref and constraints", () => {
    it("should handle minLength and maxLength on $ref parameter", async () => {
      const serviceNamespace = await tspForOpenAPI3({
        schemas: {
          StringType: {
            type: "string",
          },
        },
        paths: {
          "/foo": {
            get: {
              operationId: "getFoo",
              parameters: [
                {
                  name: "name",
                  in: "query",
                  schema: {
                    $ref: "#/components/schemas/StringType",
                    minLength: 3,
                    maxLength: 10,
                  } as any,
                },
              ],
              responses: {
                "200": { description: "Success" },
              },
            },
          },
        },
      });

      const fooOp = serviceNamespace.operations.get("getFoo");
      ok(fooOp, "getFoo operation not found");
      const nameParam = fooOp.parameters.properties.get("name");
      ok(nameParam, "name parameter not found");

      expectDecorators(
        nameParam.decorators,
        [
          { name: "query" },
          { name: "minLength", args: [Numeric("3")] },
          { name: "maxLength", args: [Numeric("10")] },
        ],
        { strict: false },
      );
    });

    it("should handle minimum and maximum on $ref parameter", async () => {
      const serviceNamespace = await tspForOpenAPI3({
        schemas: {
          IntType: {
            type: "integer",
          },
        },
        paths: {
          "/foo": {
            get: {
              operationId: "getFoo",
              parameters: [
                {
                  name: "count",
                  in: "query",
                  schema: {
                    $ref: "#/components/schemas/IntType",
                    minimum: 1,
                    maximum: 100,
                  } as any,
                },
              ],
              responses: {
                "200": { description: "Success" },
              },
            },
          },
        },
      });

      const fooOp = serviceNamespace.operations.get("getFoo");
      ok(fooOp, "getFoo operation not found");
      const countParam = fooOp.parameters.properties.get("count");
      ok(countParam, "count parameter not found");

      expectDecorators(
        countParam.decorators,
        [
          { name: "query" },
          { name: "minValue", args: [Numeric("1")] },
          { name: "maxValue", args: [Numeric("100")] },
        ],
        { strict: false },
      );
    });

    it("should handle minItems and maxItems on $ref parameter", async () => {
      const serviceNamespace = await tspForOpenAPI3({
        schemas: {
          StringArray: {
            type: "array",
            items: { type: "string" },
          },
        },
        paths: {
          "/foo": {
            get: {
              operationId: "getFoo",
              parameters: [
                {
                  name: "tags",
                  in: "query",
                  schema: {
                    $ref: "#/components/schemas/StringArray",
                    minItems: 1,
                    maxItems: 5,
                  } as any,
                },
              ],
              responses: {
                "200": { description: "Success" },
              },
            },
          },
        },
      });

      const fooOp = serviceNamespace.operations.get("getFoo");
      ok(fooOp, "getFoo operation not found");
      const tagsParam = fooOp.parameters.properties.get("tags");
      ok(tagsParam, "tags parameter not found");

      expectDecorators(
        tagsParam.decorators,
        [
          { name: "query" },
          { name: "minItems", args: [Numeric("1")] },
          { name: "maxItems", args: [Numeric("5")] },
        ],
        { strict: false },
      );
    });
  });

  describe("parameter with $ref and description", () => {
    it("should handle description on $ref parameter", async () => {
      const {
        namespace: serviceNamespace,
        program,
        diagnostics,
      } = await compileForOpenAPI3({
        schemas: {
          StringType: {
            type: "string",
          },
        },
        paths: {
          "/foo": {
            get: {
              operationId: "getFoo",
              parameters: [
                {
                  name: "name",
                  in: "query",
                  schema: {
                    $ref: "#/components/schemas/StringType",
                    description: "The name parameter",
                  } as any,
                },
              ],
              responses: {
                "200": { description: "Success" },
              },
            },
          },
        },
      });

      const fooOp = serviceNamespace.operations.get("getFoo");
      ok(fooOp, "getFoo operation not found");
      const nameParam = fooOp.parameters.properties.get("name");
      ok(nameParam, "name parameter not found");

      const docData = getDocData(program, nameParam);
      expect(docData?.value).toBe("The name parameter");
    });

    it("should handle title on $ref parameter", async () => {
      const serviceNamespace = await tspForOpenAPI3({
        schemas: {
          StringType: {
            type: "string",
          },
        },
        paths: {
          "/foo": {
            get: {
              operationId: "getFoo",
              parameters: [
                {
                  name: "name",
                  in: "query",
                  schema: {
                    $ref: "#/components/schemas/StringType",
                    title: "Name Title",
                  } as any,
                },
              ],
              responses: {
                "200": { description: "Success" },
              },
            },
          },
        },
      });

      const fooOp = serviceNamespace.operations.get("getFoo");
      ok(fooOp, "getFoo operation not found");
      const nameParam = fooOp.parameters.properties.get("name");
      ok(nameParam, "name parameter not found");

      expectDecorators(
        nameParam.decorators,
        [{ name: "query" }, { name: "summary", args: ["Name Title"] }],
        { strict: false },
      );
    });
  });

  describe("parameter with $ref and deprecated", () => {
    it("should handle deprecated on $ref parameter", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        schemas: {
          StringType: {
            type: "string",
          },
        },
        paths: {
          "/foo": {
            get: {
              operationId: "getFoo",
              parameters: [
                {
                  name: "oldParam",
                  in: "query",
                  schema: {
                    $ref: "#/components/schemas/StringType",
                    deprecated: true,
                  } as any,
                },
              ],
              responses: {
                "200": { description: "Success" },
              },
            },
          },
        },
      });

      // Should contain #deprecated directive
      expect(tsp).toContain("#deprecated");
      expect(tsp).toContain("oldParam");
    });
  });

  describe("model property with $ref and sibling keywords", () => {
    it("should handle default value on $ref property", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        schemas: {
          StatusEnum: {
            type: "string",
            enum: ["active", "inactive"],
          },
          MyModel: {
            type: "object",
            properties: {
              status: {
                $ref: "#/components/schemas/StatusEnum",
                default: "active",
              } as any,
            },
          },
        },
      });

      // Should contain default value reference to enum member
      expect(tsp).toContain("status?: StatusEnum = StatusEnum.active");
    });

    it("should handle constraints on $ref property", async () => {
      const serviceNamespace = await tspForOpenAPI3({
        schemas: {
          StringType: {
            type: "string",
          },
          MyModel: {
            type: "object",
            properties: {
              name: {
                $ref: "#/components/schemas/StringType",
                minLength: 1,
                maxLength: 50,
              } as any,
            },
          },
        },
      });

      const myModel = serviceNamespace.models.get("MyModel");
      ok(myModel, "MyModel not found");
      const nameProperty = myModel.properties.get("name");
      ok(nameProperty, "name property not found");

      expectDecorators(
        nameProperty.decorators,
        [
          { name: "minLength", args: [Numeric("1")] },
          { name: "maxLength", args: [Numeric("50")] },
        ],
        { strict: false },
      );
    });

    it("should handle description on $ref property", async () => {
      const { namespace: serviceNamespace, program } = await compileForOpenAPI3({
        schemas: {
          StringType: {
            type: "string",
          },
          MyModel: {
            type: "object",
            properties: {
              field: {
                $ref: "#/components/schemas/StringType",
                description: "A field description",
              } as any,
            },
          },
        },
      });

      const myModel = serviceNamespace.models.get("MyModel");
      ok(myModel, "MyModel not found");
      const fieldProperty = myModel.properties.get("field");
      ok(fieldProperty, "field property not found");

      const docData = getDocData(program, fieldProperty);
      expect(docData?.value).toBe("A field description");
    });

    it("should handle deprecated on $ref property", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        schemas: {
          StringType: {
            type: "string",
          },
          MyModel: {
            type: "object",
            properties: {
              oldField: {
                $ref: "#/components/schemas/StringType",
                deprecated: true,
              } as any,
            },
          },
        },
      });

      // Should contain #deprecated directive on the property
      expect(tsp).toContain("#deprecated");
      expect(tsp).toContain("oldField");
    });
  });

  describe("multiple sibling keywords", () => {
    it("should handle multiple sibling keywords together", async () => {
      const tsp = await renderTypeSpecForOpenAPI3({
        schemas: {
          StringType: {
            type: "string",
          },
        },
        paths: {
          "/foo": {
            get: {
              operationId: "getFoo",
              parameters: [
                {
                  name: "param",
                  in: "query",
                  schema: {
                    $ref: "#/components/schemas/StringType",
                    minLength: 3,
                    maxLength: 10,
                    default: "test",
                    description: "Test parameter",
                  } as any,
                },
              ],
              responses: {
                "200": { description: "Success" },
              },
            },
          },
        },
      });

      // Should contain all constraints, default, and doc comment
      expect(tsp).toContain("@minLength(3)");
      expect(tsp).toContain("@maxLength(10)");
      expect(tsp).toContain('= "test"');
      expect(tsp).toContain("Test parameter");
    });
  });
});
