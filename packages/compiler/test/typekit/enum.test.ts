import { beforeAll, expect, it } from "vitest";
import { $ } from "../../src/typekit/index.js";
import { createContextMock } from "./utils.js";
beforeAll(async () => {
  // need the side effect of creating the program.
  await createContextMock();
});

it("can build enums from unions", () => {
  const union = $.union.create({
    name: "Foo",
    variants: {
      a: 1,
      b: 2,
      c: 3,
    },
  });

  expect($.union.isValidEnum(union)).toBe(true);
  const en = $.enum.createFromUnion(union);

  expect(en.members.size).toBe(3);
  expect(en.members.get("a")!.value).toBe(1);
});
