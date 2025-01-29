import { describe, expect, it } from "vitest";
import {
  StringClient,
  BytesClient,
  DatetimeClient,
  DurationClient,
  PlainDateClient,
  PlainTimeClient,
  CollectionsByteClient,
  CollectionsModelClient,
  StringLiteralClient,
  IntLiteralClient,
  FloatLiteralClient,
  BooleanLiteralClient,
  UnionStringLiteralClient,
  UnionIntLiteralClient,
  UnionFloatLiteralClient,
  RequiredAndOptionalClient,
} from "../../../../generated/http/type/property/optionality/http-client-javascript/src/index.js";

describe("Type.Property.Optional", () => {
  describe("StringClient", () => {
    const client = new StringClient("http://localhost:3000");

    it("should get all string properties", async () => {
      const response = await client.getAll();
      expect(response).toEqual({ property: "hello" });
    });

    it("should get default string properties", async () => {
      const response = await client.getDefault();
      expect(response).toEqual({});
    });

    it("should put all string properties", async () => {
      await client.putAll({ property: "hello" });
    });

    it("should put default string properties", async () => {
      await client.putDefault({});
    });
  });

  describe("BytesClient", () => {
    const client = new BytesClient("http://localhost:3000");

    it("should get all bytes properties", async () => {
      const response = await client.getAll();
      expect(response).toEqual({ property: "aGVsbG8sIHdvcmxkIQ==" });
    });

    it("should get default bytes properties", async () => {
      const response = await client.getDefault();
      expect(response).toEqual({});
    });

    it("should put all bytes properties", async () => {
      await client.putAll({ property: "aGVsbG8sIHdvcmxkIQ==" });
    });

    it("should put default bytes properties", async () => {
      await client.putDefault({});
    });
  });

  describe("DatetimeClient", () => {
    const client = new DatetimeClient("http://localhost:3000");

    it("should get all datetime properties", async () => {
      const response = await client.getAll();
      expect(response).toEqual({ property: "2022-08-26T18:38:00Z" });
    });

    it("should get default datetime properties", async () => {
      const response = await client.getDefault();
      expect(response).toEqual({});
    });

    it("should put all datetime properties", async () => {
      await client.putAll({ property: "2022-08-26T18:38:00Z" });
    });

    it("should put default datetime properties", async () => {
      await client.putDefault({});
    });
  });

  describe("DurationClient", () => {
    const client = new DurationClient("http://localhost:3000");

    it("should get all duration properties", async () => {
      const response = await client.getAll();
      expect(response).toEqual({ property: "P123DT22H14M12.011S" });
    });

    it("should get default duration properties", async () => {
      const response = await client.getDefault();
      expect(response).toEqual({});
    });

    it("should put all duration properties", async () => {
      await client.putAll({ property: "P123DT22H14M12.011S" });
    });

    it("should put default duration properties", async () => {
      await client.putDefault({});
    });
  });

  describe("PlainDateClient", () => {
    const client = new PlainDateClient("http://localhost:3000");

    it("should get all plain date properties", async () => {
      const response = await client.getAll();
      expect(response).toEqual({ property: "2022-12-12" });
    });

    it("should get default plain date properties", async () => {
      const response = await client.getDefault();
      expect(response).toEqual({});
    });

    it("should put all plain date properties", async () => {
      await client.putAll({ property: "2022-12-12" });
    });

    it("should put default plain date properties", async () => {
      await client.putDefault({});
    });
  });

  describe("PlainTimeClient", () => {
    const client = new PlainTimeClient("http://localhost:3000");

    it("should get all plain time properties", async () => {
      const response = await client.getAll();
      expect(response).toEqual({ property: "13:06:12" });
    });

    it("should get default plain time properties", async () => {
      const response = await client.getDefault();
      expect(response).toEqual({});
    });

    it("should put all plain time properties", async () => {
      await client.putAll({ property: "13:06:12" });
    });

    it("should put default plain time properties", async () => {
      await client.putDefault({});
    });
  });

  describe("CollectionsByteClient", () => {
    const client = new CollectionsByteClient("http://localhost:3000");

    it("should get all collection byte properties", async () => {
      const response = await client.getAll();
      expect(response).toEqual({
        property: ["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="],
      });
    });

    it("should get default collection byte properties", async () => {
      const response = await client.getDefault();
      expect(response).toEqual({});
    });

    it("should put all collection byte properties", async () => {
      await client.putAll({
        property: ["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="],
      });
    });

    it("should put default collection byte properties", async () => {
      await client.putDefault({});
    });
  });

  describe("CollectionsModelClient", () => {
    const client = new CollectionsModelClient("http://localhost:3000");

    it("should get all collection model properties", async () => {
      const response = await client.getAll();
      expect(response).toEqual({
        property: [{ property: "hello" }, { property: "world" }],
      });
    });

    it("should get default collection model properties", async () => {
      const response = await client.getDefault();
      expect(response).toEqual({});
    });

    it("should put all collection model properties", async () => {
      await client.putAll({
        property: [{ property: "hello" }, { property: "world" }],
      });
    });

    it("should put default collection model properties", async () => {
      await client.putDefault({});
    });
  });

  describe("RequiredAndOptionalClient", () => {
    const client = new RequiredAndOptionalClient("http://localhost:3000");

    it("should get all required and optional properties", async () => {
      const response = await client.getAll();
      expect(response).toEqual({
        optionalProperty: "hello",
        requiredProperty: 42,
      });
    });

    it("should get only required properties", async () => {
      const response = await client.getRequiredOnly();
      expect(response).toEqual({ requiredProperty: 42 });
    });

    it("should put all required and optional properties", async () => {
      await client.putAll({ optionalProperty: "hello", requiredProperty: 42 });
    });

    it("should put only required properties", async () => {
      await client.putRequiredOnly({ requiredProperty: 42 });
    });
  });
});
