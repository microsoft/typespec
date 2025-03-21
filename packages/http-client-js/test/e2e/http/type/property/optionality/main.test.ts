import { describe, expect, it } from "vitest";
import {
  BytesClient,
  CollectionsByteClient,
  CollectionsModelClient,
  DatetimeClient,
  DurationClient,
  PlainDateClient,
  PlainTimeClient,
  RequiredAndOptionalClient,
  StringClient,
  OptionalClient
} from "../../../../generated/type/property/optionality/src/index.js";

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

describe("Type.Property.Optional", () => {
  describe("StringClient", () => {
    const rootClient = new OptionalClient({ allowInsecureConnection: true });
    const client = rootClient.stringClient;

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
    const client = new BytesClient({ allowInsecureConnection: true });

    it("should get all bytes properties", async () => {
      const response = await client.getAll();
      expect(response).toEqual({ property: helloWorldBase64 });
    });

    it("should get default bytes properties", async () => {
      const response = await client.getDefault();
      expect(response).toEqual({});
    });

    it("should put all bytes properties", async () => {
      await client.putAll({ property: helloWorldBase64 });
    });

    it("should put default bytes properties", async () => {
      await client.putDefault({});
    });
  });

  describe("DatetimeClient", () => {
    const client = new DatetimeClient({ allowInsecureConnection: true });

    it("should get all datetime properties", async () => {
      const response = await client.getAll();
      expect(response).toEqual({ property: new Date("2022-08-26T18:38:00Z") });
    });

    it("should get default datetime properties", async () => {
      const response = await client.getDefault();
      expect(response).toEqual({});
    });

    it("should put all datetime properties", async () => {
      await client.putAll({ property: new Date("2022-08-26T18:38:00Z") });
    });

    it("should put default datetime properties", async () => {
      await client.putDefault({});
    });
  });

  describe("DurationClient", () => {
    const client = new DurationClient({ allowInsecureConnection: true });

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
    const client = new PlainDateClient({ allowInsecureConnection: true });

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
    const client = new PlainTimeClient({ allowInsecureConnection: true });

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
    const client = new CollectionsByteClient({
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should get all collection byte properties", async () => {
      const response = await client.getAll();
      expect(response).toEqual({
        property: [helloWorldBase64, helloWorldBase64],
      });
    });

    it("should get default collection byte properties", async () => {
      const response = await client.getDefault();
      expect(response).toEqual({});
    });

    it("should put all collection byte properties", async () => {
      await client.putAll({
        property: [helloWorldBase64, helloWorldBase64],
      });
    });

    it("should put default collection byte properties", async () => {
      await client.putDefault({});
    });
  });

  describe("CollectionsModelClient", () => {
    const client = new CollectionsModelClient({
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

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
    const client = new RequiredAndOptionalClient({
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

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

  describe("Rest cases", () => {
    let client: OptionalClient = new OptionalClient({
      endpoint: "http://localhost:3000",
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 0
      }
    });;


    it("should handle optional boolean literal", async () => {
      const result = await client.booleanLiteralClient.getAll();
      expect(result.property).toBe(true);
      const result2 = await client.booleanLiteralClient.getDefault();
      expect(result2.property).toBeUndefined();
      await client.booleanLiteralClient.putAll({ property: true });
      await client.booleanLiteralClient.putDefault({});
    });


    it("should handle optional collections model", async () => {
      const testValue = [{ property: "hello" }, { property: "world" }];
      const result = await client.collectionsModelClient.getAll();
      expect(result.property).toEqual(testValue);
      const result2 = await client.collectionsModelClient.getDefault();
      expect(result2.property).toBeUndefined();
      await client.collectionsModelClient.putAll({ property: testValue });
      await client.collectionsModelClient.putDefault({});
    });

    it("should handle optional datetime", async () => {
      const testValue = new Date("2022-08-26T18:38:00Z");
      const result = await client.datetimeClient.getAll();
      expect(result.property).toEqual(testValue);
      const result2 = await client.datetimeClient.getDefault();
      expect(result2.property).toBeUndefined();
      await client.datetimeClient.putAll({ property: testValue });
      await client.datetimeClient.putDefault({});
    });

    it("should handle optional duration", async () => {
      const testValue = "P123DT22H14M12.011S";
      const result = await client.durationClient.getAll();
      expect(result.property).toEqual(testValue);
      const result2 = await client.durationClient.getDefault();
      expect(result2.property).toBeUndefined();
      await client.durationClient.putAll({ property: testValue });
      await client.durationClient.putDefault({});
    });

    it("should handle optional plainDate", async () => {
      const testValue = "2022-12-12";
      const result = await client.plainDateClient.getAll();
      expect(result.property).toEqual(testValue);
      const result2 = await client.plainDateClient.getDefault();
      expect(result2.property).toBeUndefined();
      const result3 = await client.plainDateClient.putAll({ property: testValue });
      expect(result3).toBeUndefined();
      await client.plainDateClient.putDefault({});
    });

    it("should handle optional plainTime", async () => {
      const testValue = "13:06:12";
      const result = await client.plainTimeClient.getAll();
      expect(result.property).toEqual(testValue);
      const result2 = await client.plainTimeClient.getDefault();
      expect(result2.property).toBeUndefined();
      const result3 = await client.plainTimeClient.putAll({
        property: testValue
      });
      expect(result3).toBeUndefined();
      await client.plainTimeClient.putDefault({});
    });

    it("should handle optional float", async () => {
      const testValue = 1.25;
      const result = await client.floatLiteralClient.getAll();
      expect(result.property).toEqual(testValue);
      const result2 = await client.floatLiteralClient.getDefault();
      expect(result2.property).toBeUndefined();
      await client.floatLiteralClient.putAll({ property: testValue });
      await client.floatLiteralClient.putDefault({});
    });

    it("should handle optional int", async () => {
      const testValue = 1;
      const result = await client.intLiteralClient.getAll();
      expect(result.property).toEqual(testValue);
      const result2 = await client.intLiteralClient.getDefault();
      expect(result2.property).toBeUndefined();
      await client.intLiteralClient.putAll({ property: testValue });
      await client.intLiteralClient.putDefault({});
    });

    it("should handle required and optional", async () => {
      const allBody = {
        optionalProperty: "hello",
        requiredProperty: 42
      };
      const requiredOnlyBody = {
        requiredProperty: 42,
        optionalProperty: undefined
      };

      const result = await client.requiredAndOptionalClient.getAll();
      expect(result).toEqual(allBody);
      const result2 = await client.requiredAndOptionalClient.getRequiredOnly();
      expect(result2).toEqual(requiredOnlyBody);
      await client.requiredAndOptionalClient.putAll(allBody);
      await client.requiredAndOptionalClient.putRequiredOnly(requiredOnlyBody);
    });

    it("should handle optional string", async () => {
      const testValue = "hello";
      const result = await client.stringClient.getAll();
      expect(result.property).toEqual(testValue);
      const result2 = await client.stringClient.getDefault();
      expect(result2.property).toBeUndefined();
      await client.stringClient.putAll({ property: testValue });
      await client.stringClient.putDefault({});
    });

    it("should handle optional string literal", async () => {
      const testValue = "hello";
      const result = await client.stringLiteralClient.getAll();
      expect(result.property).toEqual(testValue);
      const result2 = await client.stringLiteralClient.getDefault();
      expect(result2.property).toBeUndefined();
      await client.stringLiteralClient.putAll({ property: testValue });
      await client.stringLiteralClient.putDefault({});
    });

    it("should handle optional union float literal", async () => {
      const testValue = 2.375;
      const result = await client.unionFloatLiteralClient.getAll();
      expect(result.property).toEqual(testValue);
      const result2 = await client.unionFloatLiteralClient.getDefault();
      expect(result2.property).toBeUndefined();
      await client.unionFloatLiteralClient.putAll({ property: testValue });
      await client.unionFloatLiteralClient.putDefault({});
    });

    it("should handle optional union int literal", async () => {
      const testValue = 2;
      const result = await client.unionIntLiteralClient.getAll();
      expect(result.property).toEqual(testValue);
      const result2 = await client.unionIntLiteralClient.getDefault();
      expect(result2.property).toBeUndefined();
      await client.unionIntLiteralClient.putAll({ property: testValue });
      await client.unionIntLiteralClient.putDefault({});
    });

    it("should handle optional union string literal", async () => {
      const testValue = "world";
      const result = await client.unionStringLiteralClient.getAll();
      expect(result.property).toEqual(testValue);
      const result2 = await client.unionStringLiteralClient.getDefault();
      expect(result2.property).toBeUndefined();
      await client.unionStringLiteralClient.putAll({ property: testValue });
      await client.unionStringLiteralClient.putDefault({});
    });

  });
});
