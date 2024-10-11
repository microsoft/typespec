import assert from "assert";
import { expect, it } from "vitest";
import { OpenAPI3Response } from "../../src/types.js";
import { expectDecorators } from "./utils/expect.js";
import { tspForOpenAPI3 } from "./utils/tsp-for-openapi3.js";

const response: OpenAPI3Response = {
  description: "test response",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
};

it("generates operations with no params", async () => {
  const serviceNamespace = await tspForOpenAPI3({
    paths: {
      "/": {
        get: {
          operationId: "rootGet",
          parameters: [],
          responses: {
            "200": response,
          },
        },
      },
    },
  });

  const operations = serviceNamespace.operations;

  expect(operations.size).toBe(1);

  /* @route("/") @get op rootGet(): rootGet200ApplicationJsonResponse; */
  const rootGet = operations.get("rootGet");
  assert(rootGet, "rootGet operation not found");

  /* @get @route("/") */
  expectDecorators(rootGet.decorators, [{ name: "get" }, { name: "route", args: ["/"] }]);
  // verify no operation parameters
  expect(rootGet.parameters.properties.size).toBe(0);
  assert(rootGet.returnType.kind === "Model", "Expected model return type");
  expect(rootGet.returnType.name).toBe("rootGet200ApplicationJsonResponse");
});

it("generates operations without common params", async () => {
  const serviceNamespace = await tspForOpenAPI3({
    paths: {
      "/{id}": {
        get: {
          operationId: "idGet",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": response,
          },
        },
      },
    },
  });

  const operations = serviceNamespace.operations;

  expect(operations.size).toBe(1);

  /* @route("/{id}") @get op idGet(@path id: string): idGet200ApplicationJsonResponse; */
  const idGet = operations.get("idGet");
  assert(idGet, "idGet operation not found");

  /* @get @route("/{id}") */
  expectDecorators(idGet.decorators, [{ name: "get" }, { name: "route", args: ["/{id}"] }]);

  expect(idGet.parameters.properties.size).toBe(1);
  const idParam = idGet.parameters.properties.get("id")!;
  expect(idParam).toMatchObject({
    optional: false,
    type: { kind: "Scalar", name: "string" },
  });
  expectDecorators(idParam.decorators, [{ name: "path" }]);

  assert(idGet.returnType.kind === "Model", "Expected model return type");
  expect(idGet.returnType.name).toBe("idGet200ApplicationJsonResponse");
});

it("generates operations with common params", async () => {
  const serviceNamespace = await tspForOpenAPI3({
    paths: {
      "/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          operationId: "idGet",
          parameters: [],
          responses: {
            "200": response,
          },
        },
      },
    },
  });

  const operations = serviceNamespace.operations;

  expect(operations.size).toBe(1);

  /* @route("/{id}") @get op idGet(@path id: string): idGet200ApplicationJsonResponse; */
  const idGet = operations.get("idGet");
  assert(idGet, "idGet operation not found");

  /* @get @route("/{id}") */
  expectDecorators(idGet.decorators, [{ name: "get" }, { name: "route", args: ["/{id}"] }]);

  expect(idGet.parameters.properties.size).toBe(1);
  const idParam = idGet.parameters.properties.get("id")!;
  expect(idParam).toMatchObject({
    optional: false,
    type: { kind: "Scalar", name: "string" },
  });
  expectDecorators(idParam.decorators, [{ name: "path" }]);

  assert(idGet.returnType.kind === "Model", "Expected model return type");
  expect(idGet.returnType.name).toBe("idGet200ApplicationJsonResponse");
});

it("generates operations with common and specific params", async () => {
  const serviceNamespace = await tspForOpenAPI3({
    paths: {
      "/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: {
          operationId: "idGet",
          parameters: [{ name: "foo", in: "query", schema: { type: "string" } }],
          responses: {
            "200": response,
          },
        },
      },
    },
  });

  const operations = serviceNamespace.operations;

  expect(operations.size).toBe(1);

  /* @route("/{id}") @get op idGet(@path id: string, @query foo?: string): idGet200ApplicationJsonResponse; */
  const idGet = operations.get("idGet");
  assert(idGet, "idGet operation not found");

  /* @get @route("/{id}") */
  expectDecorators(idGet.decorators, [{ name: "get" }, { name: "route", args: ["/{id}"] }]);

  /* (@path id: string, @query foo?: string) */
  expect(idGet.parameters.properties.size).toBe(2);
  const idParam = idGet.parameters.properties.get("id")!;
  expect(idParam).toMatchObject({
    optional: false,
    type: { kind: "Scalar", name: "string" },
  });
  expectDecorators(idParam.decorators, [{ name: "path" }]);

  const fooParam = idGet.parameters.properties.get("foo")!;
  expect(fooParam).toMatchObject({
    optional: true,
    type: { kind: "Scalar", name: "string" },
  });
  expectDecorators(fooParam.decorators, [{ name: "query" }]);

  assert(idGet.returnType.kind === "Model", "Expected model return type");
  expect(idGet.returnType.name).toBe("idGet200ApplicationJsonResponse");
});
