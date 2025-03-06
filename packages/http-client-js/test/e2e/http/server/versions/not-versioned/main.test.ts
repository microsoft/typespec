import { describe, it } from "vitest";
import { NotVersionedClient } from "../../../../generated/server/versions/not-versioned/src/index.js";

describe("Server.Versions.NotVersioned", () => {
  const client = new NotVersionedClient("http://localhost:3000", { allowInsecureConnection: true });

  it("should execute operation 'withoutApiVersion' without an api-version", async () => {
    await client.withoutApiVersion();
    // Assert successful request
  });

  // Issue with TypeSpec building an invalid uri template with -
  it.skip("should execute operation 'withQueryApiVersion' with query api-version", async () => {
    await client.withQueryApiVersion("v1.0");
    // Assert successful request
  });

  it("should execute operation 'withPathApiVersion' with path api-version", async () => {
    await client.withPathApiVersion("v1.0");
    // Assert successful request
  });
});
