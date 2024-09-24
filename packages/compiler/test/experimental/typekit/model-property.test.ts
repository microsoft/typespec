import { beforeAll, expect, it } from "vitest";
import { $ } from "../../../src/experimental/typekit/index.js";
import { createContextMock } from "./utils.js";
beforeAll(async () => {
  // need the side effect of creating the program.
  await createContextMock();
});

it("can build enums from unions", () => {
  const modelProperty = $.modelProperty.create({
    name: "Foo",
    type: $.union.create({
      name: "Foo",
      variants: {
        a: 1,
        b: 2,
        c: 3,
      },
    }),
  });

  expect($.modelProperty.is(modelProperty)).toBe(true);
});
