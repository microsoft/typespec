import { describe, it } from "vitest";
import { VersionedClient } from "../../../../generated/server/versions/versioned/src/index.js";

describe("Server.Versions.Versioned", () => {
  const client = new VersionedClient("http://localhost:3000", { allowInsecureConnection: true });

  it("should perform operation without api-version in the URL", async () => {
    await client.withoutApiVersion();
    // Assert successful request
  });

  // Issue with TypeSpec creating an invalid URL Template containing -
  it.skip("should perform operation with query api-version, defaulting to '2022-12-01-preview'", async () => {
    await client.withQueryApiVersion("2022-12-01-preview");
    // Assert successful request
  });

  it("should perform operation with path api-version, defaulting to '2022-12-01-preview'", async () => {
    await client.withPathApiVersion("2022-12-01-preview");
    // Assert successful request
  });

  // Issue with TypeSpec creating an invalid URL Template containing -
  it.skip("should perform operation with query api-version set to '2021-01-01-preview'", async () => {
    await client.withQueryOldApiVersion("2021-01-01-preview");
    // Assert successful request
  });
});
