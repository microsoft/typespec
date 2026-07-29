import { assert, expect, it } from "vitest";
import { Operation } from "../../src/index.js";
import { expectDiagnostics, t } from "../../src/testing/index.js";
import { $ } from "../../src/typekit/index.js";
import { Tester } from "../tester.js";

it("can check if a type is a Model", async () => {
  const { Foo, program } = await Tester.compile(t.code`
    model ${t.model("Foo")} {};
  `);

  expect($(program).model.is(Foo)).toBe(true);
});

it("returns false whe the type is not a model", async () => {
  const { Foo, program } = await Tester.compile(t.code`
    interface ${t.interface("Foo")} {};
  `);

  expect($(program).model.is(Foo)).toBe(false);
  expect($(program).model.is($(program).value.create("foo"))).toBe(false);
});

it("creates a new Model", async () => {
  const { program } = await Tester.compile("");
  const foo = $(program).model.create({
    name: "Foo",
    properties: {},
  });

  expect($(program).model.is(foo)).toBe(true);
});

it("can get the effective model type", async () => {
  const { Foo, create, program } = await Tester.compile(t.code`
    model ${t.model("Foo")} {
      id: string;
    };

    op ${t.op("create")}(...Foo): void;
  `);

  const createParameters = (create as Operation).parameters;
  const model = $(program).model.getEffectiveModel(createParameters);

  // Since Foo is spread they are not the same model
  expect(createParameters).not.toBe(Foo);
  // But Foo is the effective model
  expect(model).toBe(Foo);
});

it("can get the discriminated union type", async () => {
  const { Pet, Cat, Dog, program } = await Tester.compile(t.code`
    @discriminator("kind")
    model ${t.model("Pet")} { kind: string }

    model ${t.model("Cat")} extends Pet { kind: "cat", meow: boolean }
    model ${t.model("Dog")} extends Pet { kind: "dog", bark: boolean }
  `);

  assert.ok(Pet.kind === "Model");

  const union = $(program).model.getDiscriminatedUnion(Pet);
  expect(union?.propertyName).toBe("kind");
  expect(union?.variants).toHaveLength(2);
  expect(union?.variants.get("cat")).toBe(Cat);
  expect(union?.variants.get("dog")).toBe(Dog);
});

it("can get diagnostics from getDiscriminatedUnion", async () => {
  const [{ Pet, program }] = await Tester.compileAndDiagnose(t.code`
    @discriminator("kind")
    model ${t.model("Pet")} { kind: string }

    model Cat extends Pet { meow: boolean }
  `);

  assert.ok(Pet.kind === "Model");

  const [, diagnostics] = $(program).model.getDiscriminatedUnion.withDiagnostics(Pet);
  expectDiagnostics(diagnostics, {
    code: "missing-discriminator-property",
  });
});
