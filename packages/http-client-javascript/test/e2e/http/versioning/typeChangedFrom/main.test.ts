import { describe, expect, it } from "vitest";
import { VersioningTypeChangedFromClient } from "../../../generated/http/versioning/typeChangedFrom/http-client-javascript/src/index.js";

describe("Versioning.TypeChangedFrom", () => {
  const endpoint = "http://localhost:3000";

  describe("v1", () => {
    const client = new VersioningTypeChangedFromClient(endpoint, {
      version: "v1",
    });

    it("should send and receive data using v1 API signature", async () => {
      const requestBody = { prop: "foo", changedProp: 42 };
      const queryParam = 42;

      const response = await client.test(requestBody, queryParam);
      expect(response).toEqual(requestBody); // Mock API behavior
    });
  });

  describe("v2", () => {
    const client = new VersioningTypeChangedFromClient(endpoint, {
      version: "v2",
    });

    it("should send and receive data using v2 API signature", async () => {
      const requestBody = { prop: "foo", changedProp: "bar" };
      const queryParam = "baz";

      const response = await client.test(requestBody, queryParam);
      expect(response).toEqual(requestBody); // Mock API behavior
    });
  });
});
