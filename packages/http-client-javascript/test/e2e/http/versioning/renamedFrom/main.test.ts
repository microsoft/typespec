import { describe, it, expect } from "vitest";
import {
  RenamedFromClient,
  NewInterfaceClient,
} from "../../../generated/http/versioning/renamedFrom/http-client-javascript/src/index.js";

describe("Versioning.RenamedFrom", () => {
  describe("RenamedFromClient", () => {
    const client = new RenamedFromClient("http://localhost:3000", {
      version: "v2",
    });

    it("should handle 'newOp' with renamed properties and return the expected response", async () => {
      const body = {
        newProp: "foo",
        enumProp: "newEnumMember",
        unionProp: 10,
      };
      const response = await client.newOp(body, { newQuery: "bar" });
      expect(response).toEqual(body); // Mock API expected to return the same body
    });
  });

  describe("NewInterfaceClient", () => {
    const client = new NewInterfaceClient("http://localhost:3000", {
      version: "v2",
    });

    it("should handle 'newOpInNewInterface' with renamed properties and return the expected response", async () => {
      const body = {
        newProp: "foo",
        enumProp: "newEnumMember",
        unionProp: 10,
      };
      const response = await client.newOpInNewInterface(body);
      expect(response).toEqual(body); // Mock API expected to return the same body
    });
  });
});
