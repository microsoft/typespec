import { describe, it, expect } from "vitest";
import { ServerPathMultipleClient } from "../../../../generated/http/server/path/multiple/http-client-javascript/src/index.js";

describe("Server.Path.Multiple", () => {
  const client = new ServerPathMultipleClient("http://localhost:3000", "v1.0");

  it("should call operation with client path parameters", async () => {
    const response = await client.noOperationParams();
    expect(response).toBeUndefined(); // Assert successful request
  });

  it("should call operation with client and method path parameters", async () => {
    const response = await client.withOperationPathParam("test");
    expect(response).toBeUndefined(); // Assert successful request
  });
});
