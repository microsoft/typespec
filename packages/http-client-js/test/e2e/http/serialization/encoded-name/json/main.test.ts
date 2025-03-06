import { describe, expect, it } from "vitest";
import { PropertyClient } from "../../../../generated/serialization/encoded-name/json/src/index.js";

describe("Serialization.EncodedName.Json", () => {
  describe("PropertyClient", () => {
    const client = new PropertyClient({ allowInsecureConnection: true });

    it("should send a JsonEncodedNameModel with 'defaultName' mapped to 'wireName'", async () => {
      await client.send({ defaultName: true });
      // Assert successful request
    });

    it("should deserialize a JsonEncodedNameModel with 'wireName' mapped to 'defaultName'", async () => {
      const response = await client.get();
      expect(response).toEqual({
        defaultName: true,
      }); // Mock API expected value
    });
  });
});
