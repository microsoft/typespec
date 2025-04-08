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

  it("should authenticate using the valid OAuth token", async () => {
    const client = new UnionClient(
      {
        getOAuth2Token: async () => "https://security.microsoft.com/.default",
      },
      { allowInsecureConnection: true },
    );
    await client.validToken();
    // Assert successful request
  });
});
