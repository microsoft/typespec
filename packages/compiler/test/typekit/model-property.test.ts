import { beforeAll, expect, it } from "vitest";
import { Program } from "../../src/index.js";
import { $ } from "../../src/typekit/index.js";
import { createContextMock } from "./utils.js";

let program: Program;
beforeAll(async () => {
  // need the side effect of creating the program.
  const context = await createContextMock();
  program = context.program;
});

it("can build enums from unions", () => {
  const modelProperty = $(program).modelProperty.create({
    name: "Foo",
    type: $(program).union.create({
      name: "Foo",
      variants: {
        a: 1,
        b: 2,
        c: 3,
      },
    }),
  });

  expect($(program).modelProperty.is(modelProperty)).toBe(true);
});
