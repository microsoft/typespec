import { describe, expect, it } from "vitest";
import {
  NewEnum,
  NewInterfaceClient,
  RenamedFromClient,
  Versions,
} from "../../../generated/versioning/renamedFrom/src/index.js";

describe("Versioning.RenamedFrom", () => {
  describe("RenamedFromClient", () => {
    const client = new RenamedFromClient("http://localhost:3000", Versions.V2, {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle 'newOp' with renamed properties and return the expected response", async () => {
      const body = {
        enumProp: NewEnum.NewEnumMember,
        newProp: "foo",
        unionProp: 10,
      };

      const response = await client.newOp(body, "bar");
      expect(response).toEqual(body); // Mock API expected to return the same body
    });
  });

  describe("NewInterfaceClient", () => {
    const client = new NewInterfaceClient("http://localhost:3000", Versions.V2, {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
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
