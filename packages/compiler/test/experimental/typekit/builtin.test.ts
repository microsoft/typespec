import { beforeAll, expect, it } from "vitest";
import { $ } from "../../../src/experimental/typekit/index.js";
import { createContextMock } from "./utils.js";
beforeAll(async () => {
  // need the side effect of creating the program.
  await createContextMock();
});

it("can get the builtin string type", async () => {
  const stringType = $.builtin.string;
  expect(stringType).toBeDefined();
  expect(stringType.name).toBe("string");
});

it("can get the builtin boolean type", async () => {
  const booleanType = $.builtin.boolean;
  expect(booleanType).toBeDefined();
  expect(booleanType.name).toBe("boolean");
});

it("can get the builtin numeric type", async () => {
  const numericType = $.builtin.numeric;
  expect(numericType).toBeDefined();
  expect(numericType.name).toBe("numeric");
});

it("can get the builtin int32 type", async () => {
  const int32Type = $.builtin.int32;
  expect(int32Type).toBeDefined();
  expect(int32Type.name).toBe("int32");
});

it("can get the builtin int64 type", async () => {
  const int64Type = $.builtin.int64;
  expect(int64Type).toBeDefined();
  expect(int64Type.name).toBe("int64");
});

it("can get the builtin float32 type", async () => {
  const float32Type = $.builtin.float32;
  expect(float32Type).toBeDefined();
  expect(float32Type.name).toBe("float32");
});

it("can get the builtin float64 type", async () => {
  const float64Type = $.builtin.float64;
  expect(float64Type).toBeDefined();
  expect(float64Type.name).toBe("float64");
});

it("can get the builtin bytes type", async () => {
  const bytesType = $.builtin.bytes;
  expect(bytesType).toBeDefined();
  expect(bytesType.name).toBe("bytes");
});

it("can get the builtin decimal type", async () => {
  const decimalType = $.builtin.decimal;
  expect(decimalType).toBeDefined();
  expect(decimalType.name).toBe("decimal");
});

it("can get the builtin decimal128 type", async () => {
  const decimal128Type = $.builtin.decimal128;
  expect(decimal128Type).toBeDefined();
  expect(decimal128Type.name).toBe("decimal128");
});

it("can get the builtin duration type", async () => {
  const durationType = $.builtin.duration;
  expect(durationType).toBeDefined();
  expect(durationType.name).toBe("duration");
});

it("can get the builtin float type", async () => {
  const floatType = $.builtin.float;
  expect(floatType).toBeDefined();
  expect(floatType.name).toBe("float");
});

it("can get the builtin int8 type", async () => {
  const int8Type = $.builtin.int8;
  expect(int8Type).toBeDefined();
  expect(int8Type.name).toBe("int8");
});

it("can get the builtin int16 type", async () => {
  const int16Type = $.builtin.int16;
  expect(int16Type).toBeDefined();
  expect(int16Type.name).toBe("int16");
});

it("can get the builtin integer type", async () => {
  const integerType = $.builtin.integer;
  expect(integerType).toBeDefined();
  expect(integerType.name).toBe("integer");
});

it("can get the builtin offsetDateTime type", async () => {
  const offsetDateTimeType = $.builtin.offsetDateTime;
  expect(offsetDateTimeType).toBeDefined();
  expect(offsetDateTimeType.name).toBe("offsetDateTime");
});

it("can get the builtin plainDate type", async () => {
  const plainDateType = $.builtin.plainDate;
  expect(plainDateType).toBeDefined();
  expect(plainDateType.name).toBe("plainDate");
});

it("can get the builtin plainTime type", async () => {
  const plainTimeType = $.builtin.plainTime;
  expect(plainTimeType).toBeDefined();
  expect(plainTimeType.name).toBe("plainTime");
});

it("can get the builtin safeInt type", async () => {
  const safeIntType = $.builtin.safeInt;
  expect(safeIntType).toBeDefined();
  expect(safeIntType.name).toBe("safeint");
});

it("can get the builtin uint8 type", async () => {
  const uint8Type = $.builtin.uint8;
  expect(uint8Type).toBeDefined();
  expect(uint8Type.name).toBe("uint8");
});

it("can get the builtin uint16 type", async () => {
  const uint16Type = $.builtin.uint16;
  expect(uint16Type).toBeDefined();
  expect(uint16Type.name).toBe("uint16");
});

it("can get the builtin uint32 type", async () => {
  const uint32Type = $.builtin.uint32;
  expect(uint32Type).toBeDefined();
  expect(uint32Type.name).toBe("uint32");
});

it("can get the builtin uint64 type", async () => {
  const uint64Type = $.builtin.uint64;
  expect(uint64Type).toBeDefined();
  expect(uint64Type.name).toBe("uint64");
});

it("can get the builtin url type", async () => {
  const urlType = $.builtin.url;
  expect(urlType).toBeDefined();
  expect(urlType.name).toBe("url");
});

it("can get the builtin utcDateTime type", async () => {
  const utcDateTimeType = $.builtin.utcDateTime;
  expect(utcDateTimeType).toBeDefined();
  expect(utcDateTimeType.name).toBe("utcDateTime");
});
