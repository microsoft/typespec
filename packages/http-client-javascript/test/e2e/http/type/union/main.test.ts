import { describe, expect, it } from "vitest";
import {
  EnumsOnlyClient,
  FloatsOnlyClient,
  IntsOnlyClient,
  Lr,
  MixedLiteralsClient,
  MixedTypesClient,
  ModelsOnlyClient,
  StringAndArrayClient,
  StringExtensibleClient,
  StringExtensibleNamedClient,
  StringsOnlyClient,
  Ud,
} from "../../../generated/http/type/union/http-client-javascript/src/index.js";

describe("Type.Union", () => {
  describe("StringsOnlyClient", () => {
    const client = new StringsOnlyClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a union of strings in response", async () => {
      const response = await client.get();
      expect(response.prop).toBe("b"); // Mock API expected value
    });

    it("should send a union of strings", async () => {
      await client.send("b");
      // Assert successful request
    });
  });

  describe("StringExtensibleClient", () => {
    const client = new StringExtensibleClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle an extensible string union in response", async () => {
      const response = await client.get();
      expect(response.prop).toBe("custom"); // Mock API expected value
    });

    it("should send an extensible string union", async () => {
      await client.send("custom");
      // Assert successful request
    });
  });

  describe("StringExtensibleNamedClient", () => {
    const client = new StringExtensibleNamedClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle an extensible named string union in response", async () => {
      const response = await client.get();
      expect(response.prop).toBe("custom"); // Mock API expected value
    });

    it("should send an extensible named string union", async () => {
      await client.send("custom");
      // Assert successful request
    });
  });

  describe("IntsOnlyClient", () => {
    const client = new IntsOnlyClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a union of integers in response", async () => {
      const response = await client.get();
      expect(response.prop).toBe(2); // Mock API expected value
    });

    it("should send a union of integers", async () => {
      await client.send(2);
      // Assert successful request
    });
  });

  describe("FloatsOnlyClient", () => {
    const client = new FloatsOnlyClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a union of floats in response", async () => {
      const response = await client.get();
      expect(response.prop).toBe(2.2); // Mock API expected value
    });

    it("should send a union of floats", async () => {
      await client.send(2.2);
      // Assert successful request
    });
  });

  describe("ModelsOnlyClient", () => {
    const client = new ModelsOnlyClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a union of models in response", async () => {
      const response = await client.get();
      expect(response.prop).toEqual({ name: "test" }); // Mock API expected value
    });

    it("should send a union of models", async () => {
      await client.send({ name: "test" });
      // Assert successful request
    });
  });

  describe("EnumsOnlyClient", () => {
    const client = new EnumsOnlyClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a union of enums in response", async () => {
      const response = await client.get();
      expect(response.prop).toEqual({ lr: "right", ud: "up" }); // Mock API expected value
    });

    it("should send a union of enums", async () => {
      await client.send({ lr: Lr.Right, ud: Ud.Up });
      // Assert successful request
    });
  });

  describe("StringAndArrayClient", () => {
    const client = new StringAndArrayClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a union of string and array in response", async () => {
      const response = await client.get();
      expect(response.prop).toEqual({
        string: "test",
        array: ["test1", "test2"],
      }); // Mock API expected value
    });

    it("should send a union of string and array", async () => {
      await client.send({ string: "test", array: ["test1", "test2"] });
      // Assert successful request
    });
  });

  describe("MixedLiteralsClient", () => {
    const client = new MixedLiteralsClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a union of mixed literals in response", async () => {
      const response = await client.get();
      expect(response.prop).toEqual({
        stringLiteral: "a",
        intLiteral: 2,
        floatLiteral: 3.3,
        booleanLiteral: true,
      }); // Mock API expected value
    });

    it("should send a union of mixed literals", async () => {
      await client.send({
        stringLiteral: "a",
        intLiteral: 2,
        floatLiteral: 3.3,
        booleanLiteral: true,
      });
      // Assert successful request
    });
  });

  describe("MixedTypesClient", () => {
    const client = new MixedTypesClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle a union of mixed types in response", async () => {
      const response = await client.get();
      expect(response.prop).toEqual({
        model: { name: "test" },
        literal: "a",
        int: 2,
        boolean: true,
        array: [{ name: "test" }, "a", 2, true],
      }); // Mock API expected value
    });

    it("should send a union of mixed types", async () => {
      await client.send({
        model: { name: "test" },
        literal: "a",
        int: 2,
        boolean: true,
        array: [{ name: "test" }, "a", 2, true],
      });
      // Assert successful request
    });
  });
});
