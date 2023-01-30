import assert from "assert";
import { emitSchema } from "./utils.js";

describe("emitting built-in types", () => {
  const types = new Map([
    // numeric types
    ["numeric", { type: "number" }],
    ["integer", { type: "integer" }],
    ["float", { type: "number" }],
    ["float32", { type: "number" }],
    ["float64", { type: "number" }],
    ["int8", { type: "integer" }],
    ["int16", { type: "integer" }],
    ["int32", { type: "integer" }],
    ["int64", { type: "string" }],
    ["uint8", { type: "integer" }],
    ["uint16", { type: "integer" }],
    ["uint32", { type: "integer" }],
    ["uint64", { type: "string" }],
    ["safeint", { type: "integer" }],

    // date types
    ["plainDate", { type: "string", format: "date" }],
    ["plainTime", { type: "string", format: "time" }],
    ["duration", { type: "string", format: "duration" }],

    // this is technically incorrect, date-time is an offsetDateTime.
    ["zonedDateTime", { type: "string", format: "date-time" }],

    // others
    ["string", { type: "string" }],
    ["url", { type: "string", format: "uri" }],
    ["null", { type: "null" }],
    ["bytes", { type: "string", contentEncoding: "base64" }],
    ["boolean", { type: "boolean" }],
    ["object", { type: "object" }],
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
