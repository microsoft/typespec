import { describe, expect, it } from "vitest";
import { StringClient } from "../../../../generated/type/enum/extensible/src/index.js";

describe("Type.Enum.Extensible", () => {
  describe("StringClient", () => {
    const client = new StringClient({ allowInsecureConnection: true });

    it("should handle a known value returned from the server", async () => {
      const response = await client.getKnownValue();
      expect(response).toBe("Monday"); // Mock API expected value
    });

    it("should handle an unknown value returned from the server", async () => {
      const response = await client.getUnknownValue();
      expect(response).toBe("Weekend"); // Mock API expected value
    });

    // Issue with spector mock
    it.skip("should send a known value to the server", async () => {
      await client.putKnownValue("Monday");
      // Assert successful request
    });

    // Issue with Spector mock
    it.skip("should send an unknown value to the server", async () => {
      try {
        await client.putUnknownValue("Weekend");
      } catch (err: any) {
        expect(err.response?.status).toBe("500");
      }
      // Assert successful request
    });
  });
});
