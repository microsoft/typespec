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
} from "../../../../generated/type/property/value-types/src/index.js";

const str = "hello, world!";
const encoder = new TextEncoder();
const helloWorldUint8Array = encoder.encode(str);

describe("Type.Property.ValueTypes", () => {
  describe("BooleanClient", () => {
    const client = new BooleanClient({ allowInsecureConnection: true });

    it("should handle a model with a boolean property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: true });
    });

    it("should send a model with a boolean property", async () => {
      await client.put({ property: true });
    });
  });

  describe("StringClient", () => {
    const client = new StringClient({ allowInsecureConnection: true });

    it("should handle a model with a string property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: "hello" });
    });

    it("should send a model with a string property", async () => {
      await client.put({ property: "hello" });
    });
  });

  describe("BytesClient", () => {
    const client = new BytesClient({
      allowInsecureConnection: true,
      retryOptions: { maxRetries: 1 },
    });

    it("should handle a model with a bytes property", async () => {
      const response = await client.get();
      expect(response.property).toStrictEqual(helloWorldUint8Array);
    });

    it("should send a model with a bytes property", async () => {
      await client.put({ property: helloWorldUint8Array });
    });
  });

  describe("IntClient", () => {
    const client = new IntClient({ allowInsecureConnection: true });

    it("should handle a model with an int property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: 42 });
    });

    it("should send a model with an int property", async () => {
      await client.put({ property: 42 });
    });
  });

  describe("FloatClient", () => {
    const client = new FloatClient({ allowInsecureConnection: true });

    it("should handle a model with a float property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: 43.125 });
    });

    it("should send a model with a float property", async () => {
      await client.put({ property: 43.125 });
    });
  });

  describe("DecimalClient", () => {
    const client = new DecimalClient({ allowInsecureConnection: true });

    it("should handle a model with a decimal property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: 0.33333 });
    });

    it("should send a model with a decimal property", async () => {
      await client.put({ property: 0.33333 });
    });
  });

  describe("Decimal128Client", () => {
    const client = new Decimal128Client({ allowInsecureConnection: true });

    it("should handle a model with a decimal128 property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: 0.33333 });
    });

    it("should send a model with a decimal128 property", async () => {
      await client.put({ property: 0.33333 });
    });
  });

  describe("DatetimeClient", () => {
    const client = new DatetimeClient({ allowInsecureConnection: true });

    it("should handle a model with a datetime property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: new Date("2022-08-26T18:38:00Z") });
    });

    it("should send a model with a datetime property", async () => {
      await client.put({ property: new Date("2022-08-26T18:38:00Z") });
    });
  });

  describe("DurationClient", () => {
    const client = new DurationClient({ allowInsecureConnection: true });

    it("should handle a model with a duration property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: "P123DT22H14M12.011S" });
    });

    it("should send a model with a duration property", async () => {
      await client.put({ property: "P123DT22H14M12.011S" });
    });
  });

  describe("EnumClient", () => {
    const client = new EnumClient({ allowInsecureConnection: true });

    it("should handle a model with an enum property", async () => {
      const response = await client.get();
      expect(response).toEqual({ property: "ValueOne" });
    });

    it("should send a model with an enum property", async () => {
      await client.put({ property: FixedInnerEnum.ValueOne });
    });
  });

  describe("ExtensibleEnumClient", () => {
    const client = new ExtensibleEnumClient({
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
    const client = new CollectionsStringClient({
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
