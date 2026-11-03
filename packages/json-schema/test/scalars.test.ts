import assert from "assert";
import { expect, it } from "vitest";
import { emitSchema } from "./utils.js";

it("works with scalars extending built-in scalars", async () => {
  const schemas = await emitSchema(`
    scalar Test extends uint8;
  `);

  assert.deepStrictEqual(schemas["Test.json"], {
    $id: "Test.json",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "integer",
    minimum: 0,
    maximum: 255,
  });
});

it("throws errors for scalars not extending built-in scalars", async () => {
  await assert.rejects(async () => {
    await emitSchema(`
      scalar Test;
    `);
  });
});

it("handles extensions", async () => {
  const schemas = await emitSchema(`
    @extension("x-scalar", Json<true>)
    scalar Test extends uint8;
  `);

  assert.strictEqual(schemas["Test.json"]["x-scalar"], true);
});

it("can use a scalar template", async () => {
  const schemas = await emitSchema(`
    scalar Test<T> extends uint8;

    model TestModel {
      test: Test<string>;
    }
  `);
  assert.deepStrictEqual(schemas["TestString.json"], {
    $id: "TestString.json",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "integer",
    maximum: 255,
    minimum: 0,
  });
});

it("represents compile-time type references as having no JSON values", async () => {
  const schemas = await emitSchema(`
    model Registration { type: TypeRef<string>; }
  `);
  expect(schemas["Registration.json"].properties.type).toEqual({ not: {} });
});
