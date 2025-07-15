import { assert, expect, it } from "vitest";
import { Operation } from "../../src/index.js";
import { expectDiagnostics } from "../../src/testing/expect.js";
import { createTestHost } from "../../src/testing/test-host.js";
import { createTestWrapper } from "../../src/testing/test-utils.js";
import { $ } from "../../src/typekit/index.js";
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
  expect($(program).model.is($(program).value.create("foo"))).toBe(false);
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

it("can get the discriminated union type", async () => {
  const {
    Pet,
    Cat,
    Dog,
    context: { program },
  } = await getTypes(
    `
    @discriminator("kind")
    model Pet { kind: string }

    model Cat extends Pet { kind: "cat", meow: boolean }
    model Dog extends Pet { kind: "dog", bark: boolean }
    `,
    ["Pet", "Cat", "Dog"],
  );

  assert.ok(Pet.kind === "Model");

  const union = $(program).model.getDiscriminatedUnion(Pet);
  expect(union?.propertyName).toBe("kind");
  expect(union?.variants).toHaveLength(2);
  expect(union?.variants.get("cat")).toBe(Cat);
  expect(union?.variants.get("dog")).toBe(Dog);
});

it("can get diagnostics from getDiscriminatedUnion", async () => {
  const runner = createTestWrapper(await createTestHost());
  const [{ Pet }] = await runner.compileAndDiagnose(`
    @test
    @discriminator("kind")
    model Pet { kind: string }

    model Cat extends Pet { meow: boolean }
  `);

  assert.ok(Pet.kind === "Model");

  const [, diagnostics] = $(runner.program).model.getDiscriminatedUnion.withDiagnostics(Pet);
  expectDiagnostics(diagnostics, {
    code: "missing-discriminator-property",
  });
});
