import { beforeAll, expect, it } from "vitest";
import { getDoc, Program, Union } from "../../src/index.js";
import { $ } from "../../src/typekit/index.js";
import { createContextMock, getTypes } from "./utils.js";

let program: Program;
beforeAll(async () => {
  // need the side effect of creating the program.
  const context = await createContextMock();
  program = context.program;
});

it("can build enums from unions", () => {
  const union = $(program).union.create({
    name: "Foo",
    variants: {
      a: 1,
      b: 2,
      c: 3,
    },
  });

  expect($(program).union.isValidEnum(union)).toBe(true);
  const en = $(program).enum.createFromUnion(union);

  expect(en.members.size).toBe(3);
  expect(en.members.get("a")!.value).toBe(1);
});

it("preserves documentation when copying", async () => {
  const {
    Foo,
    context: { program },
  } = await getTypes(
    `
      @doc("union named foo")
      union Foo {
        /** doc-comment for one */
        One: "one",
        Two: "two",
      }`,
    ["Foo"],
  );

  const newEnum = $(program).enum.createFromUnion(Foo as Union);
  expect(getDoc(program, newEnum)).toBe("union named foo");
  expect(getDoc(program, newEnum.members.get("One")!)).toBe("doc-comment for one");
  expect(getDoc(program, newEnum.members.get("Two")!)).toBeUndefined();
});

it("creates a named enum as a declaration (expression: false)", () => {
  const en = $(program).enum.create({
    name: "Foo",
    members: { a: 1, b: 2 },
  });
  expect(en.name).toBe("Foo");
  expect(en.expression).toBe(false);
});

it("creates an anonymous enum as an expression (expression: true)", () => {
  const en = $(program).enum.create({
    name: "",
    members: { a: 1, b: 2 },
  });
  expect(en.name).toBe("");
  expect(en.expression).toBe(true);
});

it("creates a named enum declaration expression when expression is set explicitly", () => {
  const en = $(program).enum.create({
    name: "Color",
    expression: true,
    members: { red: 1, green: 2 },
  });
  expect(en.name).toBe("Color");
  expect(en.expression).toBe(true);
});
