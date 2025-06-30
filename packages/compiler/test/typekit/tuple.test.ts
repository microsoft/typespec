import { expect, it } from "vitest";
import { BooleanLiteral, NumericLiteral, StringLiteral } from "../../src/index.js";
import { $ } from "../../src/typekit/index.js";
import { createContextMock, getTypes } from "./utils.js";

it("can create an empty tuple", async () => {
  const { program } = await createContextMock();

  const tuple = $(program).tuple.create();
  expect(tuple).toBeDefined();
  expect(tuple.values.length).toBe(0);
});

it("can create a tuple with values", async () => {
  const { program } = await createContextMock();

  const tuple = $(program).tuple.create([
    $(program).value.createBoolean(true).type,
    $(program).value.createString("foo").type,
    $(program).value.createNumeric(42).type,
  ]);
  expect(tuple).toBeDefined();
  expect(tuple.values.length).toBe(3);
  const [first, second, third] = tuple.values;
  expect(first.kind).toBe("Boolean");
  expect((first as BooleanLiteral).value).toBe(true);

  expect(second.kind).toBe("String");
  expect((second as StringLiteral).value).toBe("foo");
  expect(third.kind).toBe("Number");
  expect((third as NumericLiteral).value).toBe(42);
});

it("can create a tuple with a descriptor", async () => {
  const { program } = await createContextMock();

  const tuple = $(program).tuple.create([
    $(program).value.createBoolean(true).type,
    $(program).value.createString("foo").type,
    $(program).value.createNumeric(42).type,
  ]);
  expect(tuple).toBeDefined();
  expect(tuple.values.length).toBe(3);
  const [first, second, third] = tuple.values;
  expect(first.kind).toBe("Boolean");
  expect((first as BooleanLiteral).value).toBe(true);

  expect(second.kind).toBe("String");
  expect((second as StringLiteral).value).toBe("foo");
  expect(third.kind).toBe("Number");
  expect((third as NumericLiteral).value).toBe(42);
});

it("can check if a type is a tuple", async () => {
  const {
    Foo,
    context: { program },
  } = await getTypes(
    `
      alias Foo = [string, int32];
    `,
    ["Foo"],
  );

  expect($(program).tuple.is(Foo)).toBe(true);

  expect($(program).tuple.is($(program).value.createBoolean(true))).toBe(false);
});
