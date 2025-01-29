import { describe, expect, it } from "vitest";
import {
  Int32ValueClient,
  Int64ValueClient,
  BooleanValueClient,
  StringValueClient,
  Float32ValueClient,
  DatetimeValueClient,
  DurationValueClient,
  UnknownValueClient,
  ModelValueClient,
  NullableFloatValueClient,
  NullableInt32ValueClient,
  NullableBooleanValueClient,
  NullableStringValueClient,
  NullableModelValueClient,
} from "../../../generated/http/type/array/http-client-javascript/src/index.js";

describe("Type.Array", () => {
  describe("Int32ValueClient", () => {
    const client = new Int32ValueClient("http://localhost:3000");

    it("should handle array of int32 values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual([1, 2]);
    });

    it("should send an array of int32 values to the server", async () => {
      await client.put([1, 2]);
    });
  });

  describe("Int64ValueClient", () => {
    const client = new Int64ValueClient("http://localhost:3000");

    it("should handle array of int64 values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual([0x7fffffffffffffff, -0x7fffffffffffffff]);
    });

    it("should send an array of int64 values to the server", async () => {
      await client.put([0x7fffffffffffffff, -0x7fffffffffffffff]);
    });
  });

  describe("BooleanValueClient", () => {
    const client = new BooleanValueClient("http://localhost:3000");

    it("should handle array of boolean values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual([true, false]);
    });

    it("should send an array of boolean values to the server", async () => {
      await client.put([true, false]);
    });
  });

  describe("StringValueClient", () => {
    const client = new StringValueClient("http://localhost:3000");

    it("should handle array of string values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual(["hello", ""]);
    });

    it("should send an array of string values to the server", async () => {
      await client.put(["hello", ""]);
    });
  });

  describe("Float32ValueClient", () => {
    const client = new Float32ValueClient("http://localhost:3000");

    it("should handle array of float32 values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual([43.125]);
    });

    it("should send an array of float32 values to the server", async () => {
      await client.put([43.125]);
    });
  });

  describe("DatetimeValueClient", () => {
    const client = new DatetimeValueClient("http://localhost:3000");

    it("should handle array of datetime values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual(["2022-08-26T18:38:00Z"]);
    });

    it("should send an array of datetime values to the server", async () => {
      await client.put(["2022-08-26T18:38:00Z"]);
    });
  });

  describe("DurationValueClient", () => {
    const client = new DurationValueClient("http://localhost:3000");

    it("should handle array of duration values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual(["P123DT22H14M12.011S"]);
    });

    it("should send an array of duration values to the server", async () => {
      await client.put(["P123DT22H14M12.011S"]);
    });
  });

  describe("UnknownValueClient", () => {
    const client = new UnknownValueClient("http://localhost:3000");

    it("should handle array of unknown values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual([1, "hello", { k3: null }]);
    });

    it("should send an array of unknown values to the server", async () => {
      await client.put([1, "hello", { k3: null }]);
    });
  });

  describe("ModelValueClient", () => {
    const client = new ModelValueClient("http://localhost:3000");

    it("should handle array of model values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual([{ property: "hello" }, { property: "world" }]);
    });

    it("should send an array of model values to the server", async () => {
      await client.put([{ property: "hello" }, { property: "world" }]);
    });
  });

  describe("NullableFloatValueClient", () => {
    const client = new NullableFloatValueClient("http://localhost:3000");

    it("should handle array of nullable float values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual([1.25, null, 3.0]);
    });

    it("should send an array of nullable float values to the server", async () => {
      await client.put([1.25, null, 3.0]);
    });
  });

  describe("NullableInt32ValueClient", () => {
    const client = new NullableInt32ValueClient("http://localhost:3000");

    it("should handle array of nullable int32 values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual([1, null, 3]);
    });

    it("should send an array of nullable int32 values to the server", async () => {
      await client.put([1, null, 3]);
    });
  });

  describe("NullableBooleanValueClient", () => {
    const client = new NullableBooleanValueClient("http://localhost:3000");

    it("should handle array of nullable boolean values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual([true, null, false]);
    });

    it("should send an array of nullable boolean values to the server", async () => {
      await client.put([true, null, false]);
    });
  });

  describe("NullableStringValueClient", () => {
    const client = new NullableStringValueClient("http://localhost:3000");

    it("should handle array of nullable string values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual(["hello", null, "world"]);
    });

    it("should send an array of nullable string values to the server", async () => {
      await client.put(["hello", null, "world"]);
    });
  });

  describe("NullableModelValueClient", () => {
    const client = new NullableModelValueClient("http://localhost:3000");

    it("should handle array of nullable model values returned from the server", async () => {
      const response = await client.get();
      expect(response).toEqual([
        { property: "hello" },
        null,
        { property: "world" },
      ]);
    });

    it("should send an array of nullable model values to the server", async () => {
      await client.put([{ property: "hello" }, null, { property: "world" }]);
    });
  });
});
