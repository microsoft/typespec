import { describe, expect, it } from "vitest";
import {
  BooleanValueClient,
  DatetimeValueClient,
  DurationValueClient,
  Float32ValueClient,
  Int32ValueClient,
  Int64ValueClient,
  ModelValueClient,
  NullableFloatValueClient,
  RecursiveModelValueClient,
  StringValueClient,
  UnknownValueClient,
} from "../../../generated/http/type/dictionary/http-client-javascript/src/index.js";

describe("Type.Dictionary", () => {
  describe("Int32ValueClient", () => {
    const client = new Int32ValueClient("http://localhost:3000");

    it("should handle a dictionary of int32 values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({ k1: 1, k2: 2 });
    });

    it("should send a dictionary of int32 values to the server", async () => {
      await client.put({ k1: 1, k2: 2 });
    });
  });

  describe("Int64ValueClient", () => {
    const client = new Int64ValueClient("http://localhost:3000");

    it("should handle a dictionary of int64 values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({
        k1: BigInt("0x7FFFFFFFFFFFFFFF"),
        k2: BigInt("-0x7FFFFFFFFFFFFFFF"),
      });
    });

    it("should send a dictionary of int64 values to the server", async () => {
      await client.put({
        k1: BigInt("0x7FFFFFFFFFFFFFFF"),
        k2: BigInt("-0x7FFFFFFFFFFFFFFF"),
      });
    });
  });

  describe("BooleanValueClient", () => {
    const client = new BooleanValueClient("http://localhost:3000");

    it("should handle a dictionary of boolean values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({ k1: true, k2: false });
    });

    it("should send a dictionary of boolean values to the server", async () => {
      await client.put({ k1: true, k2: false });
    });
  });

  describe("StringValueClient", () => {
    const client = new StringValueClient("http://localhost:3000");

    it("should handle a dictionary of string values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({ k1: "hello", k2: "" });
    });

    it("should send a dictionary of string values to the server", async () => {
      await client.put({ k1: "hello", k2: "" });
    });
  });

  describe("Float32ValueClient", () => {
    const client = new Float32ValueClient("http://localhost:3000");

    it("should handle a dictionary of float32 values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({ k1: 43.125 });
    });

    it("should send a dictionary of float32 values to the server", async () => {
      await client.put({ k1: 43.125 });
    });
  });

  describe("DatetimeValueClient", () => {
    const client = new DatetimeValueClient("http://localhost:3000");

    it("should handle a dictionary of datetime values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({ k1: "2022-08-26T18:38:00Z" });
    });

    it("should send a dictionary of datetime values to the server", async () => {
      await client.put({ k1: new Date("2022-08-26T18:38:00Z") });
    });
  });

  describe("DurationValueClient", () => {
    const client = new DurationValueClient("http://localhost:3000");

    it("should handle a dictionary of duration values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({ k1: "P123DT22H14M12.011S" });
    });

    it("should send a dictionary of duration values to the server", async () => {
      await client.put({ k1: "P123DT22H14M12.011S" });
    });
  });

  describe("UnknownValueClient", () => {
    const client = new UnknownValueClient("http://localhost:3000");

    it("should handle a dictionary of unknown values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({ k1: 1, k2: "hello", k3: null });
    });

    it("should send a dictionary of unknown values to the server", async () => {
      await client.put({ k1: 1, k2: "hello", k3: null });
    });
  });

  describe("ModelValueClient", () => {
    const client = new ModelValueClient("http://localhost:3000");

    it("should handle a dictionary of model values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({
        k1: { property: "hello" },
        k2: { property: "world" },
      });
    });

    it("should send a dictionary of model values to the server", async () => {
      await client.put({
        k1: { property: "hello" },
        k2: { property: "world" },
      });
    });
  });

  describe("RecursiveModelValueClient", () => {
    const client = new RecursiveModelValueClient("http://localhost:3000");

    it("should handle a dictionary of recursive model values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({
        k1: { property: "hello", children: {} },
        k2: {
          property: "world",
          children: { "k2.1": { property: "inner world" } },
        },
      });
    });

    it("should send a dictionary of recursive model values to the server", async () => {
      await client.put({
        k1: { property: "hello", children: {} },
        k2: {
          property: "world",
          children: { "k2.1": { property: "inner world" } },
        },
      });
    });
  });

  describe("NullableFloatValueClient", () => {
    const client = new NullableFloatValueClient("http://localhost:3000");

    it("should handle a dictionary of nullable float values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual({ k1: 1.25, k2: 0.5, k3: null });
    });

    it("should send a dictionary of nullable float values to the server", async () => {
      await client.put({ k1: 1.25, k2: 0.5, k3: null });
    });
  });
});
