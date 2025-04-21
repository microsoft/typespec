import { expect, it } from "vitest";
import { $ } from "../../../src/experimental/typekit/index.js";
import { BooleanLiteral, Model, NumericLiteral, StringLiteral } from "../../../src/index.js";
import { createContextMock, getTypes } from "./utils.js";

it("can create an empty tuple", async () => {
  const { program } = await createContextMock();

  const tuple = $(program).tuple.create();
  expect(tuple).toBeDefined();
  expect(tuple.values.length).toBe(0);
});

it("can create a tuple with items", async () => {
  const { program } = await createContextMock();

  const tuple = $(program).tuple.create({
    values: [
      $(program).value.createBoolean(true).type,
      $(program).value.createString("foo").type,
      $(program).value.createNumeric(42).type,
    ],
  });
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
      model Foo { values: [string, int32] };
    `,
    ["Foo"],
  );

  const tuple = (Foo as Model).properties.get("values")?.type;
  expect(tuple).toBeDefined();

  expect($(program).tuple.is(tuple!)).toBe(true);
});
