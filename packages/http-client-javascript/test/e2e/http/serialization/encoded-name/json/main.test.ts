import { describe, expect, it } from "vitest";
import { JsonClient } from "../../../../generated/http/serialization/encoded-name/json/http-client-javascript/src/index.js";

describe("Serialization.EncodedName.Json", () => {
  describe("PropertyClient", () => {
    const client = new JsonClient("http://localhost:3000");

    it("should send a JsonEncodedNameModel with 'defaultName' mapped to 'wireName'", async () => {
      await client.propertyClient.send({
        defaultName: true,
      });
      // Assert successful request
    });

    it("should deserialize a JsonEncodedNameModel with 'wireName' mapped to 'defaultName'", async () => {
      const response = await client.propertyClient.get();
      expect(response).toEqual({
        defaultName: true,
      }); // Mock API expected value
    });
  });
});
