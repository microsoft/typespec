import { describe, expect, it } from "vitest";
import { UsageClient } from "../../../../generated/http/type/model/usage/http-client-javascript/src/index.js";

describe("Type.Model.Usage", () => {
  const client = new UsageClient("http://localhost:3000", { allowInsecureConnection: true });

  it.skip("should send a POST request with the specified body for input operation", async () => {
    // TODO: Shadowing issue
    await client.input({ requiredProp: "example-value" });
    // Assert successful request
  });

  it("should send a GET request and receive the specified body for output operation", async () => {
    const response = await client.output();
    expect(response).toEqual({ requiredProp: "example-value" }); // Mock API expected value
  });

  it("should send a POST request and receive the same body for inputAndOutput operation", async () => {
    const response = await client.inputAndOutput({
      requiredProp: "example-value",
    });
    expect(response).toEqual({ requiredProp: "example-value" }); // Mock API expected value
  });
});
