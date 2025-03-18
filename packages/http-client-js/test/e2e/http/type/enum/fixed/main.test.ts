import { describe, expect, it } from "vitest";
import { DaysOfWeekEnum, StringClient } from "../../../../generated/type/enum/fixed/src/index.js";

describe("Type.Enum.Fixed", () => {
  describe("StringClient", () => {
    const client = new StringClient({ allowInsecureConnection: true });

    it("should handle a known value returned from the server", async () => {
      const response = await client.getKnownValue();
      expect(response).toBe("Monday"); // Mock API expected value
    });

    // Mockapi issue expecting plain/text
    it.skip("should send a known value to the server", async () => {
      await client.putKnownValue(DaysOfWeekEnum.Monday);
      // Assert successful request
    });

    // Mockapi issue expecting plain/text
    it.skip("should send an unknown value to the server", async () => {
      try {
        await client.putUnknownValue("Weekend" as any);
        throw new Error("Expected error with status code 500 but request succeeded");
      } catch (err: any) {
        expect(err.response?.status).toBe("500");
      }
    });
  });
});
