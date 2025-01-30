import { describe, expect, it } from "vitest";
import {
  DaysOfWeekEnum,
  StringClient,
} from "../../../../generated/http/type/enum/fixed/http-client-javascript/src/index.js";

describe("Type.Enum.Fixed", () => {
  describe("StringClient", () => {
    const client = new StringClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a known value returned from the server", async () => {
      const response = await client.getKnownValue();
      expect(response).toBe("Monday"); // Mock API expected value
    });

    it("should send a known value to the server", async () => {
      await client.putKnownValue(DaysOfWeekEnum.Monday);
      // Assert successful request
    });

    it.only("should send an unknown value to the server", async () => {
      await client.putUnknownValue("Weekend" as any);
      // Assert successful request
    });
  });
});
