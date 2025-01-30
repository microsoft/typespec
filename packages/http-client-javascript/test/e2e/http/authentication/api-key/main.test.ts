import { describe, expect, it } from "vitest";
import { ApiKeyClient } from "../../../generated/http/authentication/api-key/http-client-javascript/src/index.js";

describe("Authentication.ApiKey", () => {
  const client = new ApiKeyClient(
    "http://localhost:3000",
    {
      key: "valid-key", // Set the default API key here
    },
    { allowInsecureConnection: true },
  );

  it("should authenticate with a valid API key", async () => {
    const response = await client.valid();
    expect(response).toBeUndefined(); // NoContentResponse is expected
  });

  it("should return error for an invalid API key", async () => {
    const invalidClient = new ApiKeyClient(
      "http://localhost:3000",
      {
        key: "invalid-key",
      },
      { allowInsecureConnection: true },
    );

    try {
      await invalidClient.invalid();
      throw new Error("Expected an error for invalid API key");
    } catch (error: any) {
      expect(error.statusCode).toBe(403);
      expect(error.body).toEqual({
        error: {
          code: "InvalidApiKey",
          message: "API key is invalid",
        },
      });
    }
  });
});
