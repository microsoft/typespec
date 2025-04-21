import { expect, it } from "vitest";
import { $ } from "../../../src/experimental/typekit/index.js";
import { Enum, getDoc, StringLiteral, Union } from "../../../src/index.js";
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
