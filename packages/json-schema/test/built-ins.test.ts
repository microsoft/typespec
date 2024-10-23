import assert from "assert";
import { describe, it } from "vitest";
import { emitSchema } from "./utils.js";

describe("emitting built-in types", () => {
  const types = new Map([
    // numeric types
    ["numeric", { type: "number" }],
    ["integer", { type: "integer" }],
    ["float", { type: "number" }],
    ["float32", { type: "number" }],
    ["float64", { type: "number" }],
    ["int8", { type: "integer", minimum: -128, maximum: 127 }],
    ["int16", { type: "integer", minimum: -32768, maximum: 32767 }],
    ["int32", { type: "integer", minimum: -2147483648, maximum: 2147483647 }],
    ["unixTimestamp32", { type: "integer", minimum: -2147483648, maximum: 2147483647 }],
    ["int64", { type: "string" }],
    ["uint8", { type: "integer", minimum: 0, maximum: 255 }],
    ["uint16", { type: "integer", minimum: 0, maximum: 65535 }],
    ["uint32", { type: "integer", minimum: 0, maximum: 4294967295 }],
    ["uint64", { type: "string" }],
    ["safeint", { type: "integer" }],
    ["decimal", { type: "string" }],
    ["decimal128", { type: "string" }],

    // date types
    ["plainDate", { type: "string", format: "date" }],
    ["plainTime", { type: "string", format: "time" }],
    ["duration", { type: "string", format: "duration" }],

    // this is technically incorrect, date-time is an offsetDateTime.
    ["utcDateTime", { type: "string", format: "date-time" }],
    ["offsetDateTime", { type: "string", format: "date-time" }],

    // others
    ["string", { type: "string" }],
    ["url", { type: "string", format: "uri" }],
    ["null", { type: "null" }],
    ["bytes", { type: "string", contentEncoding: "base64" }],
    ["boolean", { type: "boolean" }],
  ]);

  for (const [type, expectedSchema] of types) {
    it(`handles ${type}`, async () => {
      const schemas = await emitSchema(`
        model Foo {
          x: ${type}
        };
      `);

      assert.deepStrictEqual(schemas["Foo.json"].properties.x, expectedSchema);
    });
  }
});
