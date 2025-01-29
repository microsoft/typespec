import { describe, it } from "vitest";
import { ServerEndpointNotDefinedClient } from "../../../../generated/http/server/endpoint/not-defined/http-client-javascript/src/index.js";

describe("Server.Endpoint.NotDefined", () => {
  const client = new ServerEndpointNotDefinedClient("<your-endpoint>");

  it("should handle a request to a server without defining an endpoint", async () => {
    await client.valid();
    // Assert successful request
  });
});
