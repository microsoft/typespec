import { describe, expect, it } from "vitest";
import {
  ExtendsUnknownClient,
  ExtendsUnknownDerivedClient,
  ExtendsUnknownDiscriminatedClient,
  IsUnknownClient,
  IsUnknownDerivedClient,
  IsUnknownDiscriminatedClient,
} from "../../../../generated/http/type/property/additional-properties/http-client-javascript/src/index.js";

describe("Type.Property.AdditionalProperties", () => {
  describe("ExtendsUnknownClient", () => {
    const client = new ExtendsUnknownClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });
    it("Expected response body: {'name': 'ExtendsUnknownAdditionalProperties', 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      const response = await client.get();
      expect(response).toEqual({
        name: "ExtendsUnknownAdditionalProperties",
        prop1: 32,
        prop2: true,
        prop3: "abc",
      });
    });
    it("Expected input body: {'name': 'ExtendsUnknownAdditionalProperties', 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      await client.put({
        name: "ExtendsUnknownAdditionalProperties",
        prop1: 32,
        prop2: true,
        prop3: "abc",
      });
    });
  });

  describe("ExtendsUnknownDerivedClient", () => {
    const client = new ExtendsUnknownDerivedClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });
    it("Expected response body: {'name': 'ExtendsUnknownAdditionalProperties', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      const response = await client.get();
      expect(response).toEqual({
        name: "ExtendsUnknownAdditionalProperties",
        index: 314,
        age: 2.71875,
        prop1: 32,
        prop2: true,
        prop3: "abc",
      });
    });
    it("Expected input body: {'name': 'ExtendsUnknownAdditionalProperties', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      await client.put({
        name: "ExtendsUnknownAdditionalProperties",
        index: 314,
        age: 2.71875,
        prop1: 32,
        prop2: true,
        prop3: "abc",
      });
    });
  });

  describe("ExtendsUnknownDiscriminatedClient", () => {
    const client = new ExtendsUnknownDiscriminatedClient("http://localhost:3000", {
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
        prop1: 32,
        prop2: true,
        prop3: "abc",
      });
    });
    it("Expected input body: {'kind': 'derived', 'name': 'Derived', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      await client.put({
        kind: "derived",
        name: "Derived",
        index: 314,
        age: 2.71875,
        prop1: 32,
        prop2: true,
        prop3: "abc",
      });
    });
  });

  describe("IsUnknownClient", () => {
    const client = new IsUnknownClient("http://localhost:3000", { allowInsecureConnection: true });
    it("Expected response body: {'name': 'IsUnknownAdditionalProperties', 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      const response = await client.get();
      expect(response).toEqual({
        name: "IsUnknownAdditionalProperties",
        prop1: 32,
        prop2: true,
        prop3: "abc",
      });
    });
    it("Expected input body: {'name': 'IsUnknownAdditionalProperties', 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      await client.put({
        name: "IsUnknownAdditionalProperties",
        prop1: 32,
        prop2: true,
        prop3: "abc",
      });
    });
  });

  describe("IsUnknownDerivedClient", () => {
    const client = new IsUnknownDerivedClient("http://localhost:3000", {
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
        prop1: 32,
        prop2: true,
        prop3: "abc",
      });
    });
    it("Expected input body: {'name': 'IsUnknownAdditionalProperties', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      await client.put({
        name: "IsUnknownAdditionalProperties",
        index: 314,
        age: 2.71875,
        prop1: 32,
        prop2: true,
        prop3: "abc",
      });
    });
  });

  describe("IsUnknownDiscriminatedClient", () => {
    const client = new IsUnknownDiscriminatedClient("http://localhost:3000", {
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
        prop1: 32,
        prop2: true,
        prop3: "abc",
      });
    });
    it("Expected input body: {'kind': 'derived', 'name': 'Derived', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}", async () => {
      await client.put({
        kind: "derived",
        name: "Derived",
        index: 314,
        age: 2.71875,
        prop1: 32,
        prop2: true,
        prop3: "abc",
      });
    });
  });

  // Additional test cases follow the same pattern for other clients...
});
