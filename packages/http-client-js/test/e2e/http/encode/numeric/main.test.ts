import { describe, expect, it } from "vitest";
import { PropertyClient } from "../../../generated/encode/numeric/src/index.js";

describe("Encode.Numeric", () => {
  describe("PropertyClient", () => {
    const client = new PropertyClient({ allowInsecureConnection: true });

    it.skip("should send and receive safeint as string", async () => {
      const payload = { value: 10000000000 };
      const response = await client.safeintAsString(payload);
      expect(response).toEqual(payload); // Mock API expected value
    });

    it.skip("should send and receive optional uint32 as string", async () => {
      const payload = { value: 1 };
      const response = await client.uint32AsStringOptional(payload);
      expect(response).toEqual(payload); // Mock API expected value
    });

    it.skip("should send and receive uint8 as string", async () => {
      const payload = { value: 255 };
      const response = await client.uint8AsString(payload);
      expect(response).toEqual(payload); // Mock API expected value
    });
  });
});
