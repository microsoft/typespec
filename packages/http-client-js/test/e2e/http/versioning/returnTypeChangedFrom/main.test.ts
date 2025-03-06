import { describe, expect, it } from "vitest";
import {
  ReturnTypeChangedFromClient,
  Versions,
} from "../../../generated/versioning/returnTypeChangedFrom/src/index.js";

// Issue with mockapi expecting plain text
describe.skip("Versioning.ReturnTypeChangedFrom", () => {
  describe("TestClient", () => {
    const client = new ReturnTypeChangedFromClient("http://localhost:3000", Versions.V2, {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should send the request body and return the expected response body for version 'v2'", async () => {
      const response = await client.test("test");
      expect(response).toBe("test"); // Mock API expected value
    });
  });
});
