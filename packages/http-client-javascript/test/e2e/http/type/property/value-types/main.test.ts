import { describe, expect, it } from "vitest";
import {
  BooleanClient,
  BytesClient,
  CollectionsStringClient,
  DatetimeClient,
  Decimal128Client,
  DecimalClient,
  DurationClient,
  EnumClient,
  ExtensibleEnumClient,
  FixedInnerEnum,
  FloatClient,
  IntClient,
  StringClient,
} from "../../../../generated/http/type/property/value-types/http-client-javascript/src/index.js";

const base64EncodeToUint8Array = (input: string): Uint8Array => {
  // Encode the string as Base64
  const base64String = btoa(input);

  // Decode Base64 into a binary string
  const binaryString = atob(base64String);

  // Convert the binary string to a Uint8Array
  const uint8Array = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }

  return uint8Array;
};

const helloWorldBase64 = base64EncodeToUint8Array("hello, world!");

describe("Type.Property.ValueTypes", () => {
  describe("BooleanClient", () => {
    const client = new BooleanClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a model with a boolean property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: true });
    });

    it("should send a model with a boolean property", async () => {
      await client.put({ property: true });
    });
  });

  describe("StringClient", () => {
    const client = new StringClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a model with a string property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: "hello" });
    });

    it("should send a model with a string property", async () => {
      await client.put({ property: "hello" });
    });
  });

  describe("BytesClient", () => {
    const client = new BytesClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a model with a bytes property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: "aGVsbG8sIHdvcmxkIQ==" });
    });

    it("should send a model with a bytes property", async () => {
      await client.put({ property: helloWorldBase64 });
    });
  });

  describe("IntClient", () => {
    const client = new IntClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a model with an int property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: 42 });
    });

    it("should send a model with an int property", async () => {
      await client.put({ property: 42 });
    });
  });

  describe("FloatClient", () => {
    const client = new FloatClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a model with a float property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: 43.125 });
    });

    it("should send a model with a float property", async () => {
      await client.put({ property: 43.125 });
    });
  });

  describe("DecimalClient", () => {
    const client = new DecimalClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a model with a decimal property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: 0.33333 });
    });

    it("should send a model with a decimal property", async () => {
      await client.put({ property: 0.33333 });
    });
  });

  describe("Decimal128Client", () => {
    const client = new Decimal128Client("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a model with a decimal128 property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: 0.33333 });
    });

    it("should send a model with a decimal128 property", async () => {
      await client.put({ property: 0.33333 });
    });
  });

  describe("DatetimeClient", () => {
    const client = new DatetimeClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a model with a datetime property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: "2022-08-26T18:38:00Z" });
    });

    it("should send a model with a datetime property", async () => {
      await client.put({ property: new Date("2022-08-26T18:38:00Z") });
    });
  });

  describe("DurationClient", () => {
    const client = new DurationClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a model with a duration property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: "P123DT22H14M12.011S" });
    });

    it("should send a model with a duration property", async () => {
      await client.put({ property: "P123DT22H14M12.011S" });
    });
  });

  describe("EnumClient", () => {
    const client = new EnumClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a model with an enum property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: "ValueOne" });
    });

    it("should send a model with an enum property", async () => {
      await client.put({ property: FixedInnerEnum.ValueOne });
    });
  });

  describe("ExtensibleEnumClient", () => {
    const client = new ExtensibleEnumClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a model with an extensible enum property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: "UnknownValue" });
    });

    it("should send a model with an extensible enum property", async () => {
      await client.put({ property: "UnknownValue" });
    });
  });

  describe("CollectionsStringClient", () => {
    const client = new CollectionsStringClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a model with a string collection property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: ["hello", "world"] });
    });

    it("should send a model with a string collection property", async () => {
      await client.put({ property: ["hello", "world"] });
    });
  });

  // You can add similar test cases for other clients provided in the spec.
});
