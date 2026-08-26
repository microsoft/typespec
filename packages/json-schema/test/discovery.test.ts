import { expect, it } from "vitest";
import { emitSchema } from "./utils.js";

it("doesn't emit template declarations", async () => {
  const schemas = await emitSchema(
    `
      model Foo<T> { a: T }
      model Bar { b: string }
    `,
  );

  expect(Object.keys(schemas)).toEqual(["Bar.json"]);
});
