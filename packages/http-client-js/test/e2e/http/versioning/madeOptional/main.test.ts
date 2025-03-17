import { describe, expect, it } from "vitest";
import {
  MadeOptionalClient,
  Versions,
} from "../../../generated/versioning/madeOptional/src/index.js";

describe("Versioning.MadeOptional", () => {
  const endpoint = "http://localhost:3000";

  describe("v1", () => {
    const client = new MadeOptionalClient(endpoint, Versions.V1);

    it("should send the request body and handle the response for v1", async () => {
      const requestBody = { prop: "foo" };

      const response = await client.test(requestBody);

      expect(response).toEqual(requestBody); // Mock API expected value
    });
  });

  describe("v2", () => {
    const client = new MadeOptionalClient(endpoint, Versions.V2);

    it("should send the request body, additional query param, and handle the response for v2", async () => {
      const requestBody = { prop: "foo" };
      const queryParam = "exampleParam";

      const response = await client.test(requestBody, { param: queryParam });

      expect(response).toEqual(requestBody); // Mock API expected value
    });
  });
});
