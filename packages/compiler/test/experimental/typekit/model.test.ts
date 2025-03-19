import { expect, it } from "vitest";
import { $ } from "../../../src/experimental/typekit/index.js";
import { Operation } from "../../../src/index.js";
import { getTypes } from "./utils.js";

it("can check if a type is a Model", async () => {
  const { Foo } = await getTypes(
    `
    model Foo {};
    `,
    ["Foo"],
  );

  expect($.model.is(Foo)).toBe(true);
});

it("returns false whe the type is not a model", async () => {
  const { Foo } = await getTypes(
    `
    interface Foo {};
    `,
    ["Foo"],
  );

  expect($.model.is(Foo)).toBe(false);
});

it("creates a new Model", async () => {
  const foo = $.model.create({
    name: "Foo",
    properties: {},
  });

  expect($.model.is(foo)).toBe(true);
});

it("can get the effective model type", async () => {
  const { Foo, create } = await getTypes(
    `
    model Foo {
      id: string;
    };

    op create(...Foo): void;
    `,
    ["Foo", "create"],
  );

  const createParameters = (create as Operation).parameters;
  const model = $.model.getEffectiveModel(createParameters);

  // Since Foo is spread they are not the same model
  expect(createParameters).not.toBe(Foo);
  // But Foo is the effective model
  expect(model).toBe(Foo);
});
