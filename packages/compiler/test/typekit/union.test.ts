import { assert, expect, it } from "vitest";
import { Enum, getDoc, StringLiteral, Union } from "../../src/index.js";
import { expectDiagnostics, t } from "../../src/testing/index.js";
import { $ } from "../../src/typekit/index.js";
import { Tester } from "../tester.js";

it("can create a union", async () => {
  const { program } = await Tester.compile(t.code`
    model ${t.model("Foo")} {}
  `);

  const union = $(program).union.create({
    name: "Foo",
    variants: { hi: "Hello", bye: "Goodbye" },
  });
  expect(union).toBeDefined();
  expect(union.variants.size).toBe(2);
  expect((union.variants.get("hi")?.type as StringLiteral).value).toBe("Hello");
  expect((union.variants.get("bye")?.type as StringLiteral).value).toBe("Goodbye");
});

it("can create a union from array of types", async () => {
  const { Foo, Bar, Qux, FooBar, program } = await Tester.compile(t.code`
    @doc("docs for foo")
    model ${t.model("Foo")} {}
    model ${t.model("Bar")} {}
    scalar ${t.scalar("Qux")} extends string;
    alias ${t.type("FooBar")} = Foo | Bar;
  `);
  const union = $(program).union.create([Foo, Bar, Qux, FooBar]);
  expect(union).toBeDefined();

  expect(union.kind).toBe("Union");
  expect(union.expression).toBe(true);
  expect(union.variants.size).toBe(4);

  const variants = Array.from(union.variants.values());
  const fooVariant = variants.find((v) => v.type === Foo);
  expect(fooVariant).toBeDefined();
  // Check if the documentation is preserved
  expect(getDoc(program, fooVariant!)).toBe("docs for foo");

  const barVariant = variants.find((v) => v.type === Bar);
  expect(barVariant).toBeDefined();

  const quxVariant = variants.find((v) => v.type === Qux);
  expect(quxVariant).toBeDefined();

  const fooBarVariant = variants.find((v) => v.type === FooBar);
  expect(fooBarVariant).toBeDefined();
});

it("can check if the union is extensible", async () => {
  const { Foo, Bar, program } = await Tester.compile(t.code`
    union ${t.union("Foo")} {
      string;
      "hi";
      "bye";
    }

    union ${t.union("Bar")} {
      "hi";
      "bye";
    }
  `);

  expect($(program).union.isExtensible(Foo as Union)).toBe(true);
  expect($(program).union.isExtensible(Bar as Union)).toBe(false);
});

it("can build unions from enums", async () => {
  const { program } = await Tester.compile("");
  const tk = $(program);

  const srcEnum = $(program).enum.create({
    name: "foo",
    members: [tk.enumMember.create({ name: "a" }), tk.enumMember.create({ name: "b" })],
  });

  const union = tk.union.createFromEnum(srcEnum);
  expect(union).toBeDefined();
  expect(union.variants.size).toBe(2);

  expect(union.name).toBe("foo");
  expect((union.variants.get("a")?.type as StringLiteral).value).toBe("a");
  expect((union.variants.get("b")?.type as StringLiteral).value).toBe("b");
});

it("can build unions from enums with custom values", async () => {
  const { program } = await Tester.compile("");
  const tk = $(program);

  const srcEnum = tk.enum.create({
    name: "Foo",
    members: {
      a: 1,
      b: "2",
      c: 3,
    },
  });

  const union = tk.union.createFromEnum(srcEnum);
  expect(union).toBeDefined();
  expect(union.variants.size).toBe(3);

  expect(union.name).toBe("Foo");
  expect((union.variants.get("a")?.type as StringLiteral).value).toBe(1);
  expect((union.variants.get("b")?.type as StringLiteral).value).toBe("2");
  expect((union.variants.get("c")?.type as StringLiteral).value).toBe(3);
});

it("preserves documentation when copying", async () => {
  const { Foo, program } = await Tester.compile(t.code`
    @doc("enum named foo")
    enum ${t.enum("Foo")} {
      /**
       * doc-comment
       */
      a: 1;
    }
  `);

  const union = $(program).union.createFromEnum(Foo as Enum);

  expect(getDoc(program, union)).toBe("enum named foo");
  expect(getDoc(program, (union as Union).variants.get("a")!)).toBe("doc-comment");
});

it("can get the discriminated union type", async () => {
  const { Pet, Cat, Dog, program } = await Tester.compile(t.code`
    @discriminated
    union ${t.union("Pet")}{ cat: Cat, dog: Dog }

    model ${t.model("Cat")} { name: string, meow: boolean }
    model ${t.model("Dog")} { name: string, bark: boolean }
  `);

  assert.ok(Pet.kind === "Union");

  const union = $(program).union.getDiscriminatedUnion(Pet);
  expect(union?.options).toStrictEqual({
    discriminatorPropertyName: "kind",
    envelope: "object",
    envelopePropertyName: "value",
  });
  expect(union?.variants.get("cat")).toBe(Cat);
  expect(union?.variants.get("dog")).toBe(Dog);
});

it("can get diagnostics from getDiscriminatedUnion", async () => {
  const [{ Pet, program }] = await Tester.compileAndDiagnose(t.code`
    @discriminated
    union ${t.union("Pet")}{ Cat, Dog }

    model Cat { name: string, meow: boolean }
    model Dog { name: string, bark: boolean }
  `);

  assert.ok(Pet.kind === "Union");

  const [, diagnostics] = $(program).union.getDiscriminatedUnion.withDiagnostics(Pet);
  expectDiagnostics(diagnostics, {
    code: "invalid-discriminated-union-variant",
  });
});

it("can check if an entity is a union", async () => {
  const { Foo, program } = await Tester.compile(t.code`
    union ${t.union("Foo")} {
      hi: "hello",
      bye: "goodbye"
    }
  `);
  const tk = $(program);

  expect(tk.union.is(Foo)).toBe(true);
  expect(tk.union.is(tk.builtin.string)).toBe(false);
  expect(tk.union.is(tk.value.create("value"))).toBe(false);
});
