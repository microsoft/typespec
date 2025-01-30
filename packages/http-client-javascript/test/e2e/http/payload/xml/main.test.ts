import { describe, expect, it } from "vitest";
import {
  ModelWithArrayOfModelValueClient,
  ModelWithAttributesValueClient,
  ModelWithDictionaryValueClient,
  ModelWithEmptyArrayValueClient,
  ModelWithEncodedNamesValueClient,
  ModelWithOptionalFieldValueClient,
  ModelWithRenamedArraysValueClient,
  ModelWithRenamedFieldsValueClient,
  ModelWithSimpleArraysValueClient,
  ModelWithTextValueClient,
  ModelWithUnwrappedArrayValueClient,
  SimpleModelValueClient,
} from "../../../generated/http/payload/xml/http-client-javascript/src/index.js";

describe.skip("Payload.Xml", () => {
  describe("SimpleModelValueClient", () => {
    const client = new SimpleModelValueClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a SimpleModel value returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({ name: "foo", age: 123 });
    });

    it("should send a SimpleModel value to the server", async () => {
      await client.put({ name: "foo", age: 123 });
    });
  });

  describe("ModelWithSimpleArraysValueClient", () => {
    const client = new ModelWithSimpleArraysValueClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a ModelWithSimpleArrays value returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({
        colors: ["red", "green", "blue"],
        counts: [1, 2],
      });
    });

    it("should send a ModelWithSimpleArrays value to the server", async () => {
      await client.put({
        colors: ["red", "green", "blue"],
        counts: [1, 2],
      });
    });
  });

  describe("ModelWithArrayOfModelValueClient", () => {
    const client = new ModelWithArrayOfModelValueClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a ModelWithArrayOfModel value returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({
        items: [
          { name: "foo", age: 123 },
          { name: "bar", age: 456 },
        ],
      });
    });

    it("should send a ModelWithArrayOfModel value to the server", async () => {
      await client.put({
        items: [
          { name: "foo", age: 123 },
          { name: "bar", age: 456 },
        ],
      });
    });
  });

  describe("ModelWithOptionalFieldValueClient", () => {
    const client = new ModelWithOptionalFieldValueClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a ModelWithOptionalField value returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({ item: "widget" });
    });

    it("should send a ModelWithOptionalField value to the server", async () => {
      await client.put({ item: "widget" });
    });
  });

  describe("ModelWithAttributesValueClient", () => {
    const client = new ModelWithAttributesValueClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a ModelWithAttributes value returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({ id1: 123, id2: "foo", enabled: true });
    });

    it("should send a ModelWithAttributes value to the server", async () => {
      await client.put({
        id1: 123,
        id2: "foo",
        enabled: true,
      });
    });
  });

  describe("ModelWithUnwrappedArrayValueClient", () => {
    const client = new ModelWithUnwrappedArrayValueClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a ModelWithUnwrappedArray value returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({
        colors: ["red", "green", "blue"],
        counts: [1, 2],
      });
    });

    it("should send a ModelWithUnwrappedArray value to the server", async () => {
      await client.put({
        colors: ["red", "green", "blue"],
        counts: [1, 2],
      });
    });
  });

  describe("ModelWithRenamedArraysValueClient", () => {
    const client = new ModelWithRenamedArraysValueClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a ModelWithRenamedArrays value returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({
        colors: ["red", "green", "blue"],
        counts: [1, 2],
      });
    });

    it("should send a ModelWithRenamedArrays value to the server", async () => {
      await client.put({
        colors: ["red", "green", "blue"],
        counts: [1, 2],
      });
    });
  });

  describe("ModelWithRenamedFieldsValueClient", () => {
    const client = new ModelWithRenamedFieldsValueClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a ModelWithRenamedFields value returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({
        inputData: { name: "foo", age: 123 },
        outputData: { name: "bar", age: 456 },
      });
    });

    it("should send a ModelWithRenamedFields value to the server", async () => {
      await client.put({
        inputData: { name: "foo", age: 123 },
        outputData: { name: "bar", age: 456 },
      });
    });
  });

  describe("ModelWithEmptyArrayValueClient", () => {
    const client = new ModelWithEmptyArrayValueClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a ModelWithEmptyArray value returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({ items: [] });
    });

    it("should send a ModelWithEmptyArray value to the server", async () => {
      await client.put({ items: [] });
    });
  });

  describe("ModelWithTextValueClient", () => {
    const client = new ModelWithTextValueClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a ModelWithText value returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({
        language: "foo",
        content: "This is some text.",
      });
    });

    it("should send a ModelWithText value to the server", async () => {
      await client.put({
        language: "foo",
        content: "This is some text.",
      });
    });
  });

  describe("ModelWithDictionaryValueClient", () => {
    const client = new ModelWithDictionaryValueClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a ModelWithDictionary value returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({
        metadata: { Color: "blue", Count: 123, Enabled: false },
      });
    });

    it("should send a ModelWithDictionary value to the server", async () => {
      await client.put({
        metadata: { Color: "blue", Count: 123, Enabled: false } as any,
      });
    });
  });

  describe("ModelWithEncodedNamesValueClient", () => {
    const client = new ModelWithEncodedNamesValueClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a ModelWithEncodedNames value returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({
        modelData: { name: "foo", age: 123 },
        colors: ["red", "green", "blue"],
      });
    });

    it("should send a ModelWithEncodedNames value to the server", async () => {
      await client.put({
        modelData: { name: "foo", age: 123 },
        colors: ["red", "green", "blue"],
      });
    });
  });
});
