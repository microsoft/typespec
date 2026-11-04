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
