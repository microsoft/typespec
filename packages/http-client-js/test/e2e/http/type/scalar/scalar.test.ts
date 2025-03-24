import { describe, expect, it } from "vitest";
import {
  BooleanClient,
  DecimalTypeClient,
  DecimalVerifyClient,
  StringClient,
  UnknownClient,
} from "../../../generated/type/scalar/src/index.js";

describe.skip("Type.Scalar", () => {
  describe("StringClient", () => {
    const client = new StringClient({ allowInsecureConnection: true });

    it("should handle a string value returned from the server", async () => {
      const response = await client.get();
      expect(response).toBe("test"); // Mock API expected value
    });

    it("should send a string value to the server", async () => {
      await client.put("test");
      // Assert successful request
    });
  });

  describe("BooleanClient", () => {
    const client = new BooleanClient({ allowInsecureConnection: true });

    it("should handle a boolean value returned from the server", async () => {
      const response = await client.get();
      expect(response).toBe(true); // Mock API expected value
    });

    it("should send a boolean value to the server", async () => {
      await client.put(true);
      // Assert successful request
    });
  });

  describe("UnknownClient", () => {
    const client = new UnknownClient({ allowInsecureConnection: true });

    it("should handle an unknown value returned from the server", async () => {
      const response = await client.get();
      expect(response).toBe("test"); // Mock API expected value
    });

    it("should send an unknown value to the server", async () => {
      await client.put("test");
      // Assert successful request
    });
  });

  describe("DecimalTypeClient", () => {
    const client = new DecimalTypeClient({
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a decimal value returned from the server", async () => {
      const response = await client.responseBody();
      expect(response).toBe(0.33333); // Mock API expected value
    });

    it("should send a decimal value to the server", async () => {
      await client.requestBody(0.33333);
      // Assert successful request
    });

    it("should handle a decimal request parameter", async () => {
      await client.requestParameter(0.33333);
      // Assert successful request
    });
  });

  describe("DecimalVerifyClient", () => {
    const client = new DecimalVerifyClient({
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should prepare verify values for decimal", async () => {
      const response = await client.prepareVerify();
      expect(response).toEqual([0.1, 0.1, 0.1]); // Mock API expected values
    });

    it("should send a decimal value to verify", async () => {
      await client.verify(0.3);
      // Assert successful request
    });
  });
});
