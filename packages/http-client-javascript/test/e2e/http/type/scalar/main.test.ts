import { describe, expect, it } from "vitest";
import {
  BooleanClient,
  Decimal128TypeClient,
  Decimal128VerifyClient,
  DecimalTypeClient,
  DecimalVerifyClient,
  StringClient,
  UnknownClient,
} from "../../../generated/http/type/scalar/http-client-javascript/src/index.js";

describe("Type.Scalar", () => {
  describe("StringClient", () => {
    const client = new StringClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a string value returned from the server", async () => {
      const response = await client.get();
      expect(response).toBe("test");
    });

    it("should send a string value to the server", async () => {
      await client.put("test");
    });
  });

  describe("BooleanClient", () => {
    const client = new BooleanClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a boolean value returned from the server", async () => {
      const response = await client.get();
      expect(response).toBe(true);
    });

    it("should send a boolean value to the server", async () => {
      await client.put(true);
    });
  });

  describe("UnknownClient", () => {
    const client = new UnknownClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle an unknown value returned from the server", async () => {
      const response = await client.get();
      expect(response).toBe("test");
    });

    it("should send an unknown value to the server", async () => {
      await client.put("test");
    });
  });

  describe("DecimalTypeClient", () => {
    const client = new DecimalTypeClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a decimal value in the response body", async () => {
      const response = await client.responseBody();
      expect(response).toBe(0.33333);
    });

    it("should send a decimal value in the request body", async () => {
      await client.requestBody(0.33333);
    });

    it("should handle a decimal request parameter", async () => {
      await client.requestParameter(0.33333);
    });
  });

  describe("Decimal128TypeClient", () => {
    const client = new Decimal128TypeClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a decimal128 value in the response body", async () => {
      const response = await client.responseBody();
      expect(response).toBe(0.33333);
    });

    it("should send a decimal128 value in the request body", async () => {
      await client.requestBody(0.33333);
    });

    it("should handle a decimal128 request parameter", async () => {
      await client.requestParameter(0.33333);
    });
  });

  describe("DecimalVerifyClient", () => {
    const client = new DecimalVerifyClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should prepare verify values for decimal", async () => {
      const response = await client.prepareVerify();
      expect(response).toEqual([0.1, 0.1, 0.1]);
    });

    it("should send a decimal value to verify", async () => {
      await client.verify(0.3);
    });
  });

  describe("Decimal128VerifyClient", () => {
    const client = new Decimal128VerifyClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should prepare verify values for decimal128", async () => {
      const response = await client.prepareVerify();
      expect(response).toEqual([0.1, 0.1, 0.1]);
    });

    it("should send a decimal128 value to verify", async () => {
      await client.verify(0.3);
    });
  });
});
