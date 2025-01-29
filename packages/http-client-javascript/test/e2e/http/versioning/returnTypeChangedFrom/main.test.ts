import { describe, expect, it } from "vitest";
import { VersioningReturnTypeChangedFromClient } from "../../../generated/http/versioning/returnTypeChangedFrom/http-client-javascript/src/index.js";

describe("Versioning.ReturnTypeChangedFrom", () => {
  describe("TestClient", () => {
    const client = new VersioningReturnTypeChangedFromClient(
      "http://localhost:3000",
      { version: "v2" },
    );

    it("should send the request body and return the expected response body for version 'v2'", async () => {
      const response = await client.test("test");
      expect(response).toBe("test"); // Mock API expected value
    });
  });
});
