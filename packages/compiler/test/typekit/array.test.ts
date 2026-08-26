import { expect, it } from "vitest";
import { $ } from "../../src/typekit/index.js";
import { getTypes } from "./utils.js";

it("can check if a type is an Array", async () => {
  const {
    Foo,
    context: { program },
  } = await getTypes(
    `
      alias Foo = Array<string>;
    `,
    ["Foo"],
  );

  const tk = $(program);

  expect(tk.array.is(Foo)).toBe(true);
  expect(tk.array.is(tk.array.create(tk.builtin.string))).toBe(true);

  expect(tk.array.is(tk.value.create("foo"))).toBe(false);
  expect(tk.array.is(tk.model.create({ name: "Foo", properties: {} }))).toBe(false);
  expect(tk.array.is(tk.record.create(tk.builtin.string))).toBe(false);
});
