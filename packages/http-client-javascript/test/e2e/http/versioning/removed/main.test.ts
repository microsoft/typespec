import { describe, expect, it } from "vitest";
import { VersioningRemovedClient } from "../../../generated/http/versioning/removed/http-client-javascript/src/index.js";

describe("Versioning.Removed", () => {
  const client = new VersioningRemovedClient("http://localhost:3000");

  describe("v2 operation", () => {
    it("should send and receive ModelV2 with the correct signature", async () => {
      const body = {
        prop: "foo",
        enumProp: "enumMemberV2",
        unionProp: "bar",
      };
      const response = await client.v2(body);
      expect(response).toEqual(body); // Mock API expected value
    });
  });

  describe("modelV3 operation", () => {
    it("should handle ModelV3 for v1", async () => {
      client.setVersion("v1");
      const body = {
        id: "123",
        enumProp: "enumMemberV1",
      };
      const response = await client.modelV3(body);
      expect(response).toEqual(body); // Mock API expected value
    });

    it("should handle ModelV3 for v2preview", async () => {
      client.setVersion("v2preview");
      const body = {
        id: "123",
      };
      const response = await client.modelV3(body);
      expect(response).toEqual(body); // Mock API expected value
    });

    it("should handle ModelV3 for v2", async () => {
      client.setVersion("v2");
      const body = {
        id: "123",
        enumProp: "enumMemberV1",
      };
      const response = await client.modelV3(body);
      expect(response).toEqual(body); // Mock API expected value
    });
  });
});
