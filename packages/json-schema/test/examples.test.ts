import { expect, it } from "vitest";
import { emitSchema } from "./utils.js";

it("apply example on model", async () => {
  const schemas = await emitSchema(
    `
      @example(#{name: "John"})
      model Test { name: string }
      `,
  );
  expect(schemas["Test.json"].examples).toEqual([{ name: "John" }]);
});

it("apply multiple example on model", async () => {
  const schemas = await emitSchema(
    `
      @example(#{name: "Jane"})
      @example(#{name: "John"})
      model Test { name: string }
      `,
  );
  expect(schemas["Test.json"].examples).toEqual([{ name: "John" }, { name: "Jane" }]);
});

it("apply example on property", async () => {
  const schemas = await emitSchema(
    `
      model Test { @example("John") name: string }
      `,
  );
  expect(schemas["Test.json"].properties.name.examples).toEqual(["John"]);
});

it("serialize the examples with their json encoding", async () => {
  const schemas = await emitSchema(
    `
      @example(#{dob: plainDate.fromISO("2021-01-01")})
      model Test { dob: plainDate }
      `,
  );
  expect(schemas["Test.json"].examples).toEqual([{ dob: "2021-01-01" }]);
});

it("serialize numeric examples as strings with @encode(string)", async () => {
  const schemas = await emitSchema(
    `
      @example(#{ id: 9007199254740991, amount: 1050.25, scalarId: 123 })
      model Test {
        @example(9007199254740991) @encode(string) id: int64;
        @example(1050.25) @encode(string) amount: decimal;
        @example(123) scalarId: Id;
      }

      @encode(string) scalar Id extends int64;
      `,
  );
  expect(schemas["Test.json"].examples).toEqual([
    { id: "9007199254740991", amount: "1050.25", scalarId: "123" },
  ]);
  expect(schemas["Test.json"].properties.id.examples).toEqual(["9007199254740991"]);
  expect(schemas["Test.json"].properties.amount.examples).toEqual(["1050.25"]);
  expect(schemas["Test.json"].properties.scalarId.examples).toEqual(["123"]);
});

it("serialize a typed const example with @encode(string) on the scalar", async () => {
  const schemas = await emitSchema(
    `
      @service
      @jsonSchema
      namespace Ns;

      const n: int64 = 123;
      @encode(string)
      scalar Id extends int64;

      model Test {
        @example(n) id: Id;
      }
      `,
    {},
    { emitNamespace: false },
  );
  expect(schemas["Test.json"].properties.id.examples).toEqual(["123"]);
});
