import { describe, it } from "vitest";
import { NotDefinedClient } from "../../../../generated/http/server/endpoint/not-defined/http-client-javascript/src/index.js";

describe("Server.Endpoint.NotDefined", () => {
  const client = new NotDefinedClient("http://localhost:3000", { allowInsecureConnection: true });

  it("should handle a request to a server without defining an endpoint", async () => {
    await client.valid();
    // Assert successful request
  });
});
