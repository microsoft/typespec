import { assert, expect, it } from "vitest";
import { Enum, getDoc, StringLiteral, Union } from "../../src/index.js";
import { expectDiagnostics } from "../../src/testing/expect.js";
import { createTestHost } from "../../src/testing/test-host.js";
import { createTestWrapper } from "../../src/testing/test-utils.js";
import { $ } from "../../src/typekit/index.js";
import { createContextMock, getTypes } from "./utils.js";

it("can create a union", async () => {
  const {
    context: { program },
  } = await getTypes(
    `
    model Foo {}
    `,
    ["Foo"],
  );

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
  const {
    Foo,
    Bar,
    Qux,
    FooBar,
    context: { program },
  } = await getTypes(
    `
    @doc("docs for foo")
    model Foo {}
    model Bar {}
    scalar Qux extends string;
    alias FooBar = Foo | Bar;
    `,
    ["Foo", "Bar", "Qux", "FooBar"],
  );
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
  const {
    Foo,
    Bar,
    context: { program },
  } = await getTypes(
    `
    union Foo {
      string;
      "hi";
      "bye";
    }

    union Bar {
      "hi";
      "bye";
    }
    `,
    ["Foo", "Bar"],
  );

  expect($(program).union.isExtensible(Foo as Union)).toBe(true);
  expect($(program).union.isExtensible(Bar as Union)).toBe(false);
});

it("can build unions from enums", async () => {
  const { program } = await createContextMock();
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
  const { program } = await createContextMock();
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
  const {
    Foo,
    context: { program },
  } = await getTypes(
    `
    @doc("enum named foo")
    enum Foo {
      /**
       * doc-comment
       */
      a: 1;
    }`,
    ["Foo"],
  );

  const union = $(program).union.createFromEnum(Foo as Enum);

  expect(getDoc(program, union)).toBe("enum named foo");
  expect(getDoc(program, (union as Union).variants.get("a")!)).toBe("doc-comment");
});

it("can get the discriminated union type", async () => {
  const {
    Pet,
    Cat,
    Dog,
    context: { program },
  } = await getTypes(
    `
      @discriminated
      union Pet{ cat: Cat, dog: Dog }

      model Cat { name: string, meow: boolean }
      model Dog { name: string, bark: boolean }
    `,
    ["Pet", "Cat", "Dog"],
  );

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
  const runner = createTestWrapper(await createTestHost());
  const [{ Pet }] = await runner.compileAndDiagnose(`
      @test
      @discriminated
      union Pet{ Cat, Dog }

      model Cat { name: string, meow: boolean }
      model Dog { name: string, bark: boolean }
  `);

  assert.ok(Pet.kind === "Union");

  const [, diagnostics] = $(runner.program).union.getDiscriminatedUnion.withDiagnostics(Pet);
  expectDiagnostics(diagnostics, {
    code: "invalid-discriminated-union-variant",
  });
});

it("can check if an entity is a union", async () => {
  const {
    Foo,
    context: { program },
  } = await getTypes(
    `
    union Foo {
      hi: "hello",
      bye: "goodbye"
    }`,
    ["Foo"],
  );
  const tk = $(program);

  expect(tk.union.is(Foo)).toBe(true);
  expect(tk.union.is(tk.builtin.string)).toBe(false);
  expect(tk.union.is(tk.value.create("value"))).toBe(false);
});
