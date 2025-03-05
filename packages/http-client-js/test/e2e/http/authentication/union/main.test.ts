import { describe, it } from "vitest";
import { UnionClient } from "../../../generated/authentication/union/src/index.js";

describe("Authentication.Union", () => {
  it("should authenticate using the valid API key", async () => {
    const client = new UnionClient(
      {
        key: "valid-key",
      },
      { allowInsecureConnection: true },
    );
    await client.validKey();
    // Assert successful request
  });

  it.skip("should authenticate using the valid OAuth token", async () => {
    const client = new UnionClient(
      {
        getToken: async () => ({
          token: "Bearer https://security.microsoft.com/.default",
          expiresOnTimestamp: Date.now() + 3600 * 1000,
        }),
      },
      { allowInsecureConnection: true },
    );
    await client.validToken();
    // Assert successful request
  });
});
