import { describe, expect, it } from "vitest";
import {
  NewEnum,
  NewInterfaceClient,
  RenamedFromClient,
} from "../../../generated/http/versioning/renamedFrom/http-client-javascript/src/index.js";

describe("Versioning.RenamedFrom", () => {
  describe("RenamedFromClient", () => {
    const client = new RenamedFromClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
      apiVersion: "v2",
    });

    it("should handle 'newOp' with renamed properties and return the expected response", async () => {
      const body = {
        newProp: "foo",
        enumProp: "newEnumMember",
        unionProp: 10,
      };

      const response = await client.newOp("bar", {
        enumProp: NewEnum.NewEnumMember,
        newProp: "foo",
        unionProp: 10,
      });
      expect(response).toEqual(body); // Mock API expected to return the same body
    });
  });

  describe("NewInterfaceClient", () => {
    const client = new NewInterfaceClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
      apiVersion: "v2",
    });

    it("should handle 'newOpInNewInterface' with renamed properties and return the expected response", async () => {
      const body = {
        newProp: "foo",
        enumProp: "newEnumMember",
        unionProp: 10,
      };
      const response = await client.newOpInNewInterface({
        enumProp: NewEnum.NewEnumMember,
        newProp: "foo",
        unionProp: 10,
      });
      expect(response).toEqual(body); // Mock API expected to return the same body
    });
  });
});
