import { describe, it } from "vitest";
import { ServerVersionsVersionedClient } from "../../../../generated/http/server/versions/versioned/http-client-javascript/src/index.js";

describe("Server.Versions.Versioned", () => {
  const client = new ServerVersionsVersionedClient("http://localhost:3000");

  it("should perform operation without api-version in the URL", async () => {
    await client.withoutApiVersion();
    // Assert successful request
  });

  it("should perform operation with query api-version, defaulting to '2022-12-01-preview'", async () => {
    await client.withQueryApiVersion("2022-12-01-preview");
    // Assert successful request
  });

  it("should perform operation with path api-version, defaulting to '2022-12-01-preview'", async () => {
    await client.withPathApiVersion("2022-12-01-preview");
    // Assert successful request
  });

  it("should perform operation with query api-version set to '2021-01-01-preview'", async () => {
    await client.withQueryOldApiVersion("2021-01-01-preview");
    // Assert successful request
  });
});
