import { expect, it } from "vitest";
import { $ } from "../../../src/experimental/typekit/index.js";
import { Operation } from "../../../src/index.js";
import { createContextMock, getTypes } from "./utils.js";

it("can check if a type is a Model", async () => {
  const {
    Foo,
    context: { program },
  } = await getTypes(
    `
    model Foo {};
    `,
    ["Foo"],
  );

  expect($(program).model.is(Foo)).toBe(true);
});

it("returns false whe the type is not a model", async () => {
  const {
    Foo,
    context: { program },
  } = await getTypes(
    `
    interface Foo {};
    `,
    ["Foo"],
  );

  expect($(program).model.is(Foo)).toBe(false);
});

it("creates a new Model", async () => {
  const { program } = await createContextMock();
  const foo = $(program).model.create({
    name: "Foo",
    properties: {},
  });

  expect($(program).model.is(foo)).toBe(true);
});

it("can get the effective model type", async () => {
  const {
    Foo,
    create,
    context: { program },
  } = await getTypes(
    `
    model Foo {
      id: string;
    };

    op create(...Foo): void;
    `,
    ["Foo", "create"],
  );

  const createParameters = (create as Operation).parameters;
  const model = $(program).model.getEffectiveModel(createParameters);

  // Since Foo is spread they are not the same model
  expect(createParameters).not.toBe(Foo);
  // But Foo is the effective model
  expect(model).toBe(Foo);
});
