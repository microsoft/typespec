import { describe, expect, it } from "vitest";
import { OAuth2Client } from "../../../generated/http/authentication/oauth2/http-client-javascript/src/index.js";

describe("Authentication.OAuth2", () => {
  const client = new OAuth2Client(
    "http://localhost:3000",
    {
      getToken: async () => ({
        token: "Bearer https://security.microsoft.com/.default",
        expiresOnTimestamp: Date.now() + 3600 * 1000,
      }),
    },
    { allowInsecureConnection: true },
  );

  it("should validate the client is authenticated", async () => {
    const response = await client.valid();
    expect(response).toBe(undefined); // No content response
  });

  it("should handle invalid authentication and return error", async () => {
    try {
      await client.invalid();
    } catch (error: any) {
      expect(error.statusCode).toBe(403);
      expect(error.error).toMatchObject({
        message: "Expected Bearer x but got Bearer y",
        expected: "Bearer x",
        actual: "Bearer y",
      });
    }
  });
});
