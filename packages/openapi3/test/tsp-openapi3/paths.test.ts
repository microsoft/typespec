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
  expectDecorators(idParam.decorators, { name: "path" });

  const fooParam = idGet.parameters.properties.get("foo")!;
  expect(fooParam).toMatchObject({
    optional: true,
    type: { kind: "Scalar", name: "string" },
  });
  expectDecorators(fooParam.decorators, { name: "query" });

  assert(idGet.returnType.kind === "Model", "Expected model return type");
  expect(idGet.returnType.name).toBe("idGet200ApplicationJsonResponse");
});

it("supports overriding common params with operation params", async () => {
  const serviceNamespace = await tspForOpenAPI3({
    paths: {
      "/{id}": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "x-header", in: "header", required: false, schema: { type: "string" } },
        ],
        get: {
          operationId: "idGet",
          parameters: [
            { name: "foo", in: "query", schema: { type: "string" } },
            { name: "x-header", in: "header", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": response,
          },
        },
        put: {
          operationId: "idPut",
          parameters: [],
          responses: {
            "200": response,
          },
        },
      },
    },
  });

  const operations = serviceNamespace.operations;

  expect(operations.size).toBe(2);

  // `idGet` overrides the common `x-header` parameter with it's own, making it required
  /* @route("/{id}") @get op idGet(@path id: string, @query foo?: string, @header `x-header`: string): idGet200ApplicationJsonResponse; */
  const idGet = operations.get("idGet");
  assert(idGet, "idGet operation not found");

  /* @get @route("/{id}") */
  expectDecorators(idGet.decorators, [{ name: "get" }, { name: "route", args: ["/{id}"] }]);

  /* (@path id: string, @query foo?: string, @header `x-header`: string) */
  expect(idGet.parameters.properties.size).toBe(3);
  const idParam = idGet.parameters.properties.get("id")!;
  expect(idParam).toMatchObject({
    optional: false,
    type: { kind: "Scalar", name: "string" },
  });
  expectDecorators(idParam.decorators, { name: "path" });

  const fooParam = idGet.parameters.properties.get("foo")!;
  expect(fooParam).toMatchObject({
    optional: true,
    type: { kind: "Scalar", name: "string" },
  });
  expectDecorators(fooParam.decorators, { name: "query" });

  const xHeaderParam = idGet.parameters.properties.get("x-header")!;
  expect(xHeaderParam).toMatchObject({
    optional: false,
    type: { kind: "Scalar", name: "string" },
  });
  expectDecorators(xHeaderParam.decorators, { name: "header" });

  assert(idGet.returnType.kind === "Model", "Expected model return type");
  expect(idGet.returnType.name).toBe("idGet200ApplicationJsonResponse");

  // `idPut` uses the common `x-header` parameter, which is marked optional
  /* @route("/{id}") @put op idPut(@path id: string, @header `x-header`: string): idPut200ApplicationJsonResponse; */
  const idPut = operations.get("idPut");
  assert(idPut, "idPut operation not found");

  /* @put @route("/{id}") */
  expectDecorators(idPut.decorators, [{ name: "put" }, { name: "route", args: ["/{id}"] }]);

  /* (@path id: string, @header `x-header`?: string) */
  expect(idPut.parameters.properties.size).toBe(2);
  const idPutParam = idPut.parameters.properties.get("id")!;
  expect(idPutParam).toMatchObject({
    optional: false,
    type: { kind: "Scalar", name: "string" },
  });
  expectDecorators(idPutParam.decorators, [{ name: "path" }]);

  const xHeaderSharedParam = idPut.parameters.properties.get("x-header")!;
  expect(xHeaderSharedParam).toMatchObject({
    optional: true,
    type: { kind: "Scalar", name: "string" },
  });
  expectDecorators(xHeaderSharedParam.decorators, { name: "header" });

  assert(idPut.returnType.kind === "Model", "Expected model return type");
  expect(idPut.returnType.name).toBe("idPut200ApplicationJsonResponse");
});

it("supports operation summary", async () => {
  const serviceNamespace = await tspForOpenAPI3({
    paths: {
      "/": {
        get: {
          operationId: "rootGet",
          summary: "Root Get Summary",
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

  /* @get @route("/") @summary("Root Get Summary") */
  expectDecorators(rootGet.decorators, [
    { name: "summary", args: [{ jsValue: "Root Get Summary" }] },
    { name: "get" },
    { name: "route", args: ["/"] },
  ]);
  // verify no operation parameters
  expect(rootGet.parameters.properties.size).toBe(0);
  assert(rootGet.returnType.kind === "Model", "Expected model return type");
  expect(rootGet.returnType.name).toBe("rootGet200ApplicationJsonResponse");
});
