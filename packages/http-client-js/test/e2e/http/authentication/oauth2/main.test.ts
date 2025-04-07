import { describe, expect, it } from "vitest";
import { OAuth2Client } from "../../../generated/authentication/oauth2/src/index.js";

describe("Authentication.OAuth2", () => {
  const client = new OAuth2Client(
    {
      getOAuth2Token: async () => "https://security.microsoft.com/.default",
    },
    { allowInsecureConnection: true },
  );

  it("should validate the client is authenticated", async () => {
    const response = await client.valid();
    expect(response).toBe(undefined); // No content response
  });

  it("should handle invalid authentication and return error", async () => {
    try {
      const client = new OAuth2Client(
        {
          getOAuth2Token: async () => "invalid",
        },
        { allowInsecureConnection: true },
      );
      await client.invalid();
    } catch (error: any) {
      expect(error.status).toBe("403");
      expect(error.body.error).toBe("invalid-grant");
    }
  });
});
