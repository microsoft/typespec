import { describe, expect, it } from "vitest";
import { MultipleClient, Versions } from "../../../../generated/server/path/multiple/src/index.js";

describe("Server.Path.Multiple", () => {
  const client = new MultipleClient("http://localhost:3000", Versions.V1_0, {
    allowInsecureConnection: true,
    retryOptions: {
      maxRetries: 0,
    },
    apiVersion: "v1.0",
  });

  it("should call operation with client path parameters", async () => {
    const response = await client.noOperationParams();
    expect(response).toBeUndefined(); // Assert successful request
  });

  it("should call operation with client and method path parameters", async () => {
    const response = await client.withOperationPathParam("test");
    expect(response).toBeUndefined(); // Assert successful request
  });
});
