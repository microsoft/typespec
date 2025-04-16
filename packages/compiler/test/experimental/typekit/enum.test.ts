import { beforeAll, expect, it } from "vitest";
import { $ } from "../../../src/experimental/typekit/index.js";
import { Program } from "../../../src/index.js";
import { createContextMock } from "./utils.js";

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
