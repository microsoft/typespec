import { describe, expect, it } from "vitest";
import {
  ExtendsUnknownAdditionalPropertiesDiscriminatedDerived,
  ExtendsUnknownClient,
  ExtendsUnknownDerivedClient,
  ExtendsUnknownDiscriminatedClient,
  IsUnknownClient,
  IsUnknownDerivedClient,
  IsUnknownDiscriminatedClient,
} from "../../../../generated/type/property/additional-properties/src/index.js";

describe("Type.Property.AdditionalProperties", () => {
  describe("ExtendsUnknownClient", () => {
    const client = new ExtendsUnknownClient({
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });
    it("Expected response body: {'name': 'ExtendsUnknownAdditionalProperties', 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      const response = await client.get();
      expect(response).toEqual({
        additionalProperties: {
          prop1: 32,
          prop2: true,
          prop3: "abc",
        },
        name: "ExtendsUnknownAdditionalProperties",
      });
    });
    it("Expected input body: {'name': 'ExtendsUnknownAdditionalProperties', 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      await client.put({
        additionalProperties: { prop1: 32, prop2: true, prop3: "abc" },
        name: "ExtendsUnknownAdditionalProperties",
      });
    });
  });

  describe("ExtendsUnknownDerivedClient", () => {
    const client = new ExtendsUnknownDerivedClient({
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });
    it("Expected response body: {'name': 'ExtendsUnknownAdditionalProperties', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      const response = await client.get();
      expect(response).toEqual({
        additionalProperties: {
          prop1: 32,
          prop2: true,
          prop3: "abc",
        },
        name: "ExtendsUnknownAdditionalProperties",
        index: 314,
        age: 2.71875,
      });
    });
    it("Expected input body: {'name': 'ExtendsUnknownAdditionalProperties', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      await client.put({
        name: "ExtendsUnknownAdditionalProperties",
        index: 314,
        age: 2.71875,
        additionalProperties: { prop1: 32, prop2: true, prop3: "abc" },
      });
    });
  });

  describe("ExtendsUnknownDiscriminatedClient", () => {
    const client = new ExtendsUnknownDiscriminatedClient({
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });
    it("Expected response body: {'kind': 'derived', 'name': 'Derived', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      const response = await client.get();
      expect(response).toEqual({
        additionalProperties: { prop1: 32, prop2: true, prop3: "abc" },
        kind: "derived",
        name: "Derived",
        index: 314,
        age: 2.71875,
      });
    });
    it("Expected input body: {'kind': 'derived', 'name': 'Derived', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      const input: ExtendsUnknownAdditionalPropertiesDiscriminatedDerived = {
        index: 314,
        age: 2.71875,
        kind: "derived",
        name: "Derived",
        additionalProperties: {
          prop1: 32,
          prop2: true,
          prop3: "abc",
        },
      };
      await client.put(input);
    });
  });

  describe("IsUnknownClient", () => {
    const client = new IsUnknownClient({ allowInsecureConnection: true });
    it("Expected response body: {'name': 'IsUnknownAdditionalProperties', 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      const response = await client.get();
      expect(response).toEqual({
        name: "IsUnknownAdditionalProperties",
        additionalProperties: { prop1: 32, prop2: true, prop3: "abc" },
      });
    });

    it("Expected input body: {'name': 'IsUnknownAdditionalProperties', 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      await client.put({
        name: "IsUnknownAdditionalProperties",
        additionalProperties: {
          prop1: 32,
          prop2: true,
          prop3: "abc",
        },
      });
    });
  });

  describe("IsUnknownDerivedClient", () => {
    const client = new IsUnknownDerivedClient({
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });
    it("Expected response body: {'name': 'IsUnknownAdditionalProperties', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      const response = await client.get();
      expect(response).toEqual({
        name: "IsUnknownAdditionalProperties",
        index: 314,
        age: 2.71875,
        additionalProperties: { prop1: 32, prop2: true, prop3: "abc" },
      });
    });
    it("Expected input body: {'name': 'IsUnknownAdditionalProperties', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      await client.put({
        name: "IsUnknownAdditionalProperties",
        index: 314,
        age: 2.71875,
        additionalProperties: {
          prop1: 32,
          prop2: true,
          prop3: "abc",
        },
      });
    });
  });

  describe("IsUnknownDiscriminatedClient", () => {
    const client = new IsUnknownDiscriminatedClient({
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });
    it("Expected response body: {'kind': 'derived', 'name': 'Derived', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      const response = await client.get();
      expect(response).toEqual({
        kind: "derived",
        name: "Derived",
        index: 314,
        age: 2.71875,
        additionalProperties: { prop1: 32, prop2: true, prop3: "abc" },
      });
    });
    it("Expected input body: {'kind': 'derived', 'name': 'Derived', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      await client.put({
        kind: "derived",
        name: "Derived",
        index: 314,
        age: 2.71875,
        additionalProperties: {
          prop1: 32,
          prop2: true,
          prop3: "abc",
        },
      } as any);
    });
  });
});
