import { describe, expect, it } from "vitest";
import { EmptyClient } from "../../../../generated/http/type/model/empty/http-client-javascript/src/index.js";

describe("Type.Model.Empty", () => {
  const client = new EmptyClient("http://localhost:3000", { allowInsecureConnection: true });

  it("should send a PUT request with an empty body", async () => {
    await client.putEmpty({});
    // Assert successful request
  });

  it("should handle a GET request returning an empty body", async () => {
    const response = await client.getEmpty();
    expect(response).toEqual({});
  });

  it("should send a POST request with an empty body and receive the same", async () => {
    const response = await client.postRoundTripEmpty({});
    expect(response).toEqual({});
  });
});
