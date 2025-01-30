import { describe, expect, it } from "vitest";
import {
  BytesClient,
  CollectionsByteClient,
  CollectionsModelClient,
  CollectionsStringClient,
  DatetimeClient,
  DurationClient,
  StringClient,
} from "../../../../generated/http/type/property/nullable/http-client-javascript/src/index.js";

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

describe("Type.Property.Nullable", () => {
  describe("StringClient", () => {
    const client = new StringClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should get a model with all properties present (nullable string)", async () => {
      const response = await client.getNonNull();
      expect(response).toEqual({
        requiredProperty: "foo",
        nullableProperty: "hello",
      });
    });

    it("should get a model with default properties (nullable string)", async () => {
      const response = await client.getNull();
      expect(response).toEqual({
        requiredProperty: "foo",
        nullableProperty: null,
      });
    });

    it("should patch a model with all properties present (nullable string)", async () => {
      await client.patchNonNull({
        requiredProperty: "foo",
        nullableProperty: "hello",
      });
    });

    it("should patch a model with default properties (nullable string)", async () => {
      await client.patchNull({
        requiredProperty: "foo",
        nullableProperty: null,
      });
    });
  });

  describe("BytesClient", () => {
    const client = new BytesClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should get a model with all properties present (nullable bytes)", async () => {
      const response = await client.getNonNull();
      expect(response).toEqual({
        requiredProperty: "foo",
        nullableProperty: "aGVsbG8sIHdvcmxkIQ==",
      });
    });

    it("should get a model with default properties (nullable bytes)", async () => {
      const response = await client.getNull();
      expect(response).toEqual({
        requiredProperty: "foo",
        nullableProperty: null,
      });
    });

    it("should patch a model with all properties present (nullable bytes)", async () => {
      await client.patchNonNull({
        requiredProperty: "foo",
        nullableProperty: helloWorldBase64,
      });
    });

    it("should patch a model with default properties (nullable bytes)", async () => {
      await client.patchNull({
        requiredProperty: "foo",
        nullableProperty: null,
      });
    });
  });

  describe("DatetimeClient", () => {
    const client = new DatetimeClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should get a model with all properties present (nullable datetime)", async () => {
      const response = await client.getNonNull();
      expect(response).toEqual({
        requiredProperty: "foo",
        nullableProperty: "2022-08-26T18:38:00Z",
      });
    });

    it("should get a model with default properties (nullable datetime)", async () => {
      const response = await client.getNull();
      expect(response).toEqual({
        requiredProperty: "foo",
        nullableProperty: null,
      });
    });

    it("should patch a model with all properties present (nullable datetime)", async () => {
      await client.patchNonNull({
        requiredProperty: "foo",
        nullableProperty: new Date("2022-08-26T18:38:00Z"),
      });
    });

    it("should patch a model with default properties (nullable datetime)", async () => {
      await client.patchNull({
        requiredProperty: "foo",
        nullableProperty: null,
      });
    });
  });

  describe("DurationClient", () => {
    const client = new DurationClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should get a model with all properties present (nullable duration)", async () => {
      const response = await client.getNonNull();
      expect(response).toEqual({
        requiredProperty: "foo",
        nullableProperty: "P123DT22H14M12.011S",
      });
    });

    it("should get a model with default properties (nullable duration)", async () => {
      const response = await client.getNull();
      expect(response).toEqual({
        requiredProperty: "foo",
        nullableProperty: null,
      });
    });

    it("should patch a model with all properties present (nullable duration)", async () => {
      await client.patchNonNull({
        requiredProperty: "foo",
        nullableProperty: "P123DT22H14M12.011S",
      });
    });

    it("should patch a model with default properties (nullable duration)", async () => {
      await client.patchNull({
        requiredProperty: "foo",
        nullableProperty: null,
      });
    });
  });

  describe("CollectionsByteClient", () => {
    const client = new CollectionsByteClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should get a model with all properties present (nullable collection bytes)", async () => {
      const response = await client.getNonNull();
      expect(response).toEqual({
        requiredProperty: "foo",
        nullableProperty: ["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="],
      });
    });

    it("should get a model with default properties (nullable collection bytes)", async () => {
      const response = await client.getNull();
      expect(response).toEqual({
        requiredProperty: "foo",
        nullableProperty: null,
      });
    });

    it("should patch a model with all properties present (nullable collection bytes)", async () => {
      await client.patchNonNull({
        requiredProperty: "foo",
        nullableProperty: [helloWorldBase64, helloWorldBase64],
      });
    });

    it("should patch a model with default properties (nullable collection bytes)", async () => {
      await client.patchNull({
        requiredProperty: "foo",
        nullableProperty: null,
      });
    });
  });

  describe("CollectionsModelClient", () => {
    const client = new CollectionsModelClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should get a model with all properties present (nullable collection models)", async () => {
      const response = await client.getNonNull();
      expect(response).toEqual({
        requiredProperty: "foo",
        nullableProperty: [{ property: "hello" }, { property: "world" }],
      });
    });

    it("should get a model with default properties (nullable collection models)", async () => {
      const response = await client.getNull();
      expect(response).toEqual({
        requiredProperty: "foo",
        nullableProperty: null,
      });
    });

    it("should patch a model with all properties present (nullable collection models)", async () => {
      await client.patchNonNull({
        requiredProperty: "foo",
        nullableProperty: [{ property: "hello" }, { property: "world" }],
      });
    });

    it("should patch a model with default properties (nullable collection models)", async () => {
      await client.patchNull({
        requiredProperty: "foo",
        nullableProperty: null,
      });
    });
  });

  describe("CollectionsStringClient", () => {
    const client = new CollectionsStringClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should get a model with all properties present (nullable collection strings)", async () => {
      const response = await client.getNonNull();
      expect(response).toEqual({
        requiredProperty: "foo",
        nullableProperty: ["hello", "world"],
      });
    });

    it("should get a model with default properties (nullable collection strings)", async () => {
      const response = await client.getNull();
      expect(response).toEqual({
        requiredProperty: "foo",
        nullableProperty: null,
      });
    });

    it("should patch a model with all properties present (nullable collection strings)", async () => {
      await client.patchNonNull({
        requiredProperty: "foo",
        nullableProperty: ["hello", "world"],
      });
    });

    it("should patch a model with default properties (nullable collection strings)", async () => {
      await client.patchNull({
        requiredProperty: "foo",
        nullableProperty: null,
      });
    });
  });
});
