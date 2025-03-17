import { describe, expect, it } from "vitest";
import { OAuth2Client } from "../../../generated/authentication/oauth2/src/index.js";

describe("Authentication.OAuth2", () => {
  const client = new OAuth2Client(
    {
      getToken: async () => ({
        token: "Bearer https://security.microsoft.com/.default",
        expiresOnTimestamp: Date.now() + 3600 * 1000,
      }),
    },
    { allowInsecureConnection: true },
  );

  it.skip("should validate the client is authenticated", async () => {
    const response = await client.valid();
    expect(response).toBe(undefined); // No content response
  });

  it.skip("should handle invalid authentication and return error", async () => {
    try {
      const client = new OAuth2Client(
        {
          getToken: async () => ({
            token: "invalid",
            expiresOnTimestamp: Date.now() + 3600 * 1000,
          }),
        },
        { allowInsecureConnection: true },
      );
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
