import { describe, expect, it } from "vitest";
import { ReturnTypeChangedFromClient } from "../../../generated/http/versioning/returnTypeChangedFrom/http-client-javascript/src/index.js";

describe("Versioning.ReturnTypeChangedFrom", () => {
  describe("TestClient", () => {
    const client = new ReturnTypeChangedFromClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
      apiVersion: "v2",
    });

    it("should send the request body and return the expected response body for version 'v2'", async () => {
      const response = await client.test("test");
      expect(response).toBe("test"); // Mock API expected value
    });
  });
});
