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
  ValueTypesClient
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
  describe("Rest cases", () => {
    interface TypeDetail {
      type: string;
      defaultValue: any;
      convertedToFn?: (_: any) => any;
    }

    const testedTypes: TypeDetail[] = [
      {
        type: "boolean",
        defaultValue: true
      },
      {
        type: "string",
        defaultValue: "hello"
      },
      {
        type: "int",
        defaultValue: 42
      },
      {
        type: "float",
        defaultValue: 43.125
      },
      {
        type: "decimal",
        defaultValue: 0.33333
      },
      {
        type: "decimal128",
        defaultValue: 0.33333
      },
      {
        type: "datetime",
        defaultValue: new Date("2022-08-26T18:38:00Z")
      },
      {
        type: "duration",
        defaultValue: "P123DT22H14M12.011S"
      },
      {
        type: "enum",
        defaultValue: "ValueOne"
      },
      {
        type: "extensible-enum",
        defaultValue: "UnknownValue"
      },
      {
        type: "model",
        defaultValue: { property: "hello" }
      },
      {
        type: "collections/string",
        defaultValue: ["hello", "world"]
      },
      {
        type: "collections/int",
        defaultValue: [1, 2]
      },
      {
        type: "collections/model",
        defaultValue: [{ property: "hello" }, { property: "world" }]
      },
      {
        type: "dictionary/string",
        defaultValue: { k1: "hello", k2: "world" }
      },
      {
        type: "never",
        defaultValue: undefined
      },
      {
        type: "unknown/string",
        defaultValue: "hello"
      },
      {
        type: "unknown/int",
        defaultValue: 42
      },
      {
        type: "unknown/dict",
        defaultValue: { k1: "hello", k2: 42 }
      },
      {
        type: "unknown/array",
        defaultValue: ["hello", "world"]
      },
      {
        type: "string/literal",
        defaultValue: "hello"
      },
      {
        type: "int/literal",
        defaultValue: 42
      },
      {
        type: "float/literal",
        defaultValue: 43.125
      },
      {
        type: "boolean/literal",
        defaultValue: true
      },
      {
        type: "union/string/literal",
        defaultValue: "world"
      },
      {
        type: "union/int/literal",
        defaultValue: 42
      },
      {
        type: "union/float/literal",
        defaultValue: 46.875
      },
      {
        type: "union-enum-value",
        defaultValue: "value2"
      }
    ];
    const client = new ValueTypesClient({
      endpoint: "http://localhost:3000",
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 0
      }
    });
    for (let item of testedTypes) {
      it(`should get a ${item.type} value`, async () => {
        let result: any;
        if (item.convertedToFn) {
          item.defaultValue = item.convertedToFn(item.defaultValue);
        } else {
          // item.defaultValue = item.defaultValue;
        }
        switch (item.type) {
          case "boolean":
            result = await client.booleanClient.get();
            break;
          case "string":
            result = await client.stringClient.get();
            break;
          case "bytes":
            result = await client.bytesClient.get();
            break;
          case "int":
            result = await client.intClient.get();
            break;
          case "float":
            result = await client.floatClient.get();
            break;
          case "decimal":
            result = await client.decimalClient.get();
            break;
          case "decimal128":
            result = await client.decimal128Client.get();
            break;
          case "datetime":
            result = await client.datetimeClient.get();
            break;
          case "duration":
            result = await client.durationClient.get();
            break;
          case "enum":
            result = await client.enumClient.get();
            break;
          case "extensible-enum":
            result = await client.extensibleEnumClient.get();
            break;
          case "model":
            result = await client.modelClient.get();
            break;
          case "collections/string":
            result = await client.collectionsStringClient.get();
            break;
          case "collections/int":
            result = await client.collectionsIntClient.get();
            break;
          case "collections/model":
            result = await client.collectionsModelClient.get();
            break;
          case "dictionary/string":
            result = await client.dictionaryStringClient.get();
            break;
          case "never":
            result = await client.neverClient.get();
            break;
          case "unknown/string":
            result = await client.unknownStringClient.get();
            break;
          case "unknown/int":
            result = await client.unknownIntClient.get();
            break;
          case "unknown/dict":
            result = await client.unknownDictClient.get();
            break;
          case "unknown/array":
            result = await client.unknownArrayClient.get();
            break;
          case "string/literal":
            result = await client.stringLiteralClient.get();
            break;
          case "int/literal":
            result = await client.intLiteralClient.get();
            break;
          case "float/literal":
            result = await client.floatLiteralClient.get();
            break;
          case "boolean/literal":
            result = await client.booleanLiteralClient.get();
            break;
          case "union/string/literal":
            result = await client.unionStringLiteralClient.get();
            break;
          case "union/int/literal":
            result = await client.unionIntLiteralClient.get();
            break;
          case "union/float/literal":
            result = await client.unionFloatLiteralClient.get();
            break;
          case "union-enum-value":
            result = await client.unionEnumValueClient.get();
            break;
          default:
            throw new Error(`Unknown type ${item.type}`);
        }
        expect(result.property).toEqual(item.defaultValue);
      });
    }
    for (let item of testedTypes) {
      it(`should put a ${item.type} value`, async () => {
        let result: any;
        if (item.convertedToFn) {
          item.defaultValue = item.convertedToFn(item.defaultValue);
        } else {
          // item.defaultValue = item.defaultValue;
        }
        switch (item.type) {
          case "boolean":
            result = await client.booleanClient.put({ property: item.defaultValue });
            break;
          case "string":
            result = await client.stringClient.put({ property: item.defaultValue });
            break;
          case "bytes":
            result = await client.bytesClient.put({
              property: item.defaultValue
            });
            break;
          case "int":
            result = await client.intClient.put({ property: item.defaultValue });
            break;
          case "float":
            result = await client.floatClient.put({ property: item.defaultValue });
            break;
          case "decimal":
            result = await client.decimalClient.put({ property: item.defaultValue });
            break;
          case "decimal128":
            result = await client.decimal128Client.put({
              property: item.defaultValue
            });
            break;
          case "datetime":
            result = await client.datetimeClient.put({
              property: item.defaultValue
            });
            break;
          case "duration":
            result = await client.durationClient.put({
              property: item.defaultValue
            });
            break;
          case "enum":
            result = await client.enumClient.put({ property: item.defaultValue });
            break;
          case "extensible-enum":
            result = await client.extensibleEnumClient.put({
              property: item.defaultValue
            });
            break;
          case "model":
            result = await client.modelClient.put({
              property: item.defaultValue
            });
            break;
          case "collections/string":
            result = await client.collectionsStringClient.put({
              property: item.defaultValue
            });
            break;
          case "collections/int":
            result = await client.collectionsIntClient.put({
              property: item.defaultValue
            });
            break;
          case "collections/model":
            result = await client.collectionsModelClient.put({
              property: item.defaultValue
            });
            break;
          case "dictionary/string":
            result = await client.dictionaryStringClient.put({
              property: item.defaultValue
            });
            break;
          case "never":
            result = await client.neverClient.put({
              property: item.defaultValue as never
            });
            break;
          case "unknown/string":
            result = await client.unknownStringClient.put({
              property: item.defaultValue
            });
            break;
          case "unknown/int":
            result = await client.unknownIntClient.put({
              property: item.defaultValue
            });
            break;
          case "unknown/dict":
            result = await client.unknownDictClient.put({
              property: item.defaultValue
            });
            break;
          case "unknown/array":
            result = await client.unknownArrayClient.put({
              property: item.defaultValue
            });
            break;
          case "string/literal":
            result = await client.stringLiteralClient.put({
              property: item.defaultValue
            });
            break;
          case "int/literal":
            result = await client.intLiteralClient.put({
              property: item.defaultValue
            });
            break;
          case "float/literal":
            result = await client.floatLiteralClient.put({
              property: item.defaultValue
            });
            break;
          case "boolean/literal":
            result = await client.booleanLiteralClient.put({
              property: item.defaultValue
            });
            break;
          case "union/string/literal":
            result = await client.unionStringLiteralClient.put({
              property: item.defaultValue
            });
            break;
          case "union/int/literal":
            result = await client.unionIntLiteralClient.put({
              property: item.defaultValue
            });
            break;
          case "union/float/literal":
            result = await client.unionFloatLiteralClient.put({
              property: item.defaultValue
            });
            break;
          case "union-enum-value":
            result = await client.unionEnumValueClient.put({
              property: item.defaultValue
            });
            break;
          default:
            throw new Error(`Unknown type ${item.type}`);
        }
        expect(result).toBeUndefined();
      });
    }
  });
});
