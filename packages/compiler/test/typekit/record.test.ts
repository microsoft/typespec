import { expect, it } from "vitest";
import { $ } from "../../src/typekit/index.js";
import { getTypes } from "./utils.js";

it("can check if a type is a Record", async () => {
  const {
    Foo,
    context: { program },
  } = await getTypes(
    `
      alias Foo = Record<string>;
    `,
    ["Foo"],
  );

  const tk = $(program);

  expect(tk.record.is(Foo)).toBe(true);
  expect(tk.record.is(tk.record.create(tk.builtin.string))).toBe(true);

  expect(tk.record.is(tk.value.create("foo"))).toBe(false);
  expect(tk.record.is(tk.model.create({ name: "Foo", properties: {} }))).toBe(false);
  expect(tk.record.is(tk.array.create(tk.builtin.string))).toBe(false);
});
