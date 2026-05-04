import { beforeEach, describe, expect, it, vi } from "vitest";
import { transformPaths } from "../../src/cli/actions/convert/transforms/transform-paths.js";
import { createContext } from "../../src/cli/actions/convert/utils/context.js";
import { convertOpenAPI3Document, JsonSchemaType } from "../../src/index.js";

describe("Convert OpenAPI3 with missing operationId", () => {
  // Mock logger to capture warnings
  const mockLogger = {
    trace: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate operationId and show warning when missing", async () => {
    const openApiDoc = {
      info: { title: "Test", version: "1.0.0" },
      openapi: "3.0.0",
      paths: {
        "/users": {
          get: {
            // This one is missing operationId
            parameters: [],
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      type: "array" as JsonSchemaType,
                      items: { type: "string" as JsonSchemaType },
                    },
                  },
                },
              },
            },
          },
        },
        "/users/{id}": {
          post: {
            operationId: "createUser", // This one has an operationId
            parameters: [],
            responses: {
              "201": {
                description: "Created",
              },
            },
          },
          get: {
            // This one is missing operationId
            parameters: [],
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      },
    };

    const context = createContext(openApiDoc as any, mockLogger);
    const operations = transformPaths(openApiDoc.paths, context);

    // Should have 3 operations
    expect(operations.length).toBe(3);

    // Check that warnings were logged for missing operationIds
    expect(mockLogger.warn.mock.calls.length).toBe(2);
    expect(mockLogger.warn.mock.calls[0][0]).toBe(
      "Open API operation 'GET /users' is missing an operationId. Generated: 'get_users'",
    );
    expect(mockLogger.warn.mock.calls[1][0]).toBe(
      "Open API operation 'GET /users/{id}' is missing an operationId. Generated: 'get_users_id'",
    );

    // Check generated operationIds
    const getUsersOp = operations.find((op) => op.operationId === "get_users");
    const createUserOp = operations.find((op) => op.operationId === "createUser");
    const getUserByIdOp = operations.find((op) => op.operationId === "get_users_id");

    expect(getUsersOp?.name).toBe("get_users");
    expect(createUserOp?.name).toBe("createUser");
    expect(getUserByIdOp?.name).toBe("get_users_id");
  });

  it("should clean special characters from paths", async () => {
    const openApiDoc = {
      info: { title: "Test", version: "1.0.0" },
      openapi: "3.0.0",
      paths: {
        "/api/v1/users/{user-id}/profile": {
          get: {
            parameters: [],
            responses: { "200": { description: "Success" } },
          },
        },
        "/": {
          get: {
            parameters: [],
            responses: { "200": { description: "Success" } },
          },
        },
      },
    };

    const context = createContext(openApiDoc as any, mockLogger);
    const operations = transformPaths(openApiDoc.paths, context);

    // Should have 2 operations
    expect(operations.length).toBe(2);

    // Check generated operationIds
    const complexPathOp = operations.find(
      (op) => op.operationId === "get_api_v1_users_user_id_profile",
    );
    const rootOp = operations.find((op) => op.operationId === "get_root");

    expect(complexPathOp?.name).toBe("get_api_v1_users_user_id_profile");
    expect(rootOp?.name).toBe("get_root");

    // Check warnings
    expect(mockLogger.warn.mock.calls.length).toBe(2);
    expect(mockLogger.warn.mock.calls[0][0]).toBe(
      "Open API operation 'GET /api/v1/users/{user-id}/profile' is missing an operationId. Generated: 'get_api_v1_users_user_id_profile'",
    );
    expect(mockLogger.warn.mock.calls[1][0]).toBe(
      "Open API operation 'GET /' is missing an operationId. Generated: 'get_root'",
    );
  });

  it("should work with full document conversion", async () => {
    const tsp = await convertOpenAPI3Document({
      info: {
        title: "Test Service",
        version: "1.0.0",
      },
      openapi: "3.0.0",
      paths: {
        "/users": {
          get: {
            summary: "List users",
            parameters: [],
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Should contain the generated operation name
    expect(tsp.includes("op get_users")).toBe(true);
    expect(tsp.includes('@route("/users")')).toBe(true);
    expect(tsp.includes("@get")).toBe(true);
  });
});
