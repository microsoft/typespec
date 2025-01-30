import { describe, expect, it } from "vitest";
import {
  EnumV2,
  EnumV3,
  ModelV3,
  RemovedClient,
} from "../../../generated/http/versioning/removed/http-client-javascript/src/index.js";

describe("Versioning.Removed", () => {
  const client = new RemovedClient("http://localhost:3000", { allowInsecureConnection: true });

  describe("v2 operation", () => {
    it("should send and receive ModelV2 with the correct signature", async () => {
      const body = {
        prop: "foo",
        enumProp: EnumV2.EnumMemberV2,
        unionProp: "bar",
      };
      const response = await client.v2("foo", body as any);
      expect(response).toEqual(body); // Mock API expected value
    });
  });

  describe("modelV3 operation", () => {
    it("should handle ModelV3 for v1", async () => {
      const client = new RemovedClient("http://localhost:3000", {
        allowInsecureConnection: true,
        retryOptions: {
          maxRetries: 1,
        },
        apiVersion: "v1",
      });
      const body: ModelV3 = {
        id: "123",
        enumProp: EnumV3.EnumMemberV1,
      };
      const response = await client.modelV3(body);
      expect(response).toEqual(body); // Mock API expected value
    });

    it("should handle ModelV3 for v2preview", async () => {
      const client = new RemovedClient("http://localhost:3000", {
        allowInsecureConnection: true,
        retryOptions: {
          maxRetries: 1,
        },
        apiVersion: "v2Preview",
      });

      const body = {
        id: "123",
        enumProp: EnumV3.EnumMemberV1,
      };
      const response = await client.modelV3(body);
      expect(response).toEqual(body); // Mock API expected value
    });

    it("should handle ModelV3 for v2", async () => {
      const client = new RemovedClient("http://localhost:3000", {
        allowInsecureConnection: true,
        retryOptions: {
          maxRetries: 1,
        },
        apiVersion: "v2",
      });

      const body = {
        id: "123",
        enumProp: EnumV3.EnumMemberV1,
      };
      const response = await client.modelV3(body);
      expect(response).toEqual(body); // Mock API expected value
    });
  });
});
