import { describe, expect, it } from "vitest";
import { NotDiscriminatedClient } from "../../../../../generated/http/type/model/inheritance/not-discriminated/http-client-javascript/src/index.js";

describe("Type.Model.Inheritance.NotDiscriminated", () => {
  const client = new NotDiscriminatedClient("http://localhost:3000", {
    allowInsecureConnection: true,
    retryOptions: {
      maxRetries: 0,
    },
  });

  it("should generate and send model", async () => {
    await client.postValid({
      name: "abc",
      age: 32,
      smart: true,
    });
    // Assert successful request
  });

  it("should generate and receive model", async () => {
    const response = await client.getValid();
    expect(response).toEqual({
      name: "abc",
      age: 32,
      smart: true,
    }); // Mock API expected value
  });

  it("should generate, send, and receive round-trip bottom model", async () => {
    const response = await client.putValid({
      name: "abc",
      age: 32,
      smart: true,
    });
    expect(response).toEqual({
      name: "abc",
      age: 32,
      smart: true,
    }); // Mock API expected value
  });
});
