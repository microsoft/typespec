import { expect, it } from "vitest";
import { defineKit } from "../../../src/experimental/typekit/define-kit.js";
import { $ } from "../../../src/experimental/typekit/index.js";
import { createContextMock } from "./utils.js";

it("supports nested kits", async () => {
  const { program } = await createContextMock();
  defineKit({
    test: {
      get foo() {
        return this.program.checker.anyType;
      },
      nested: {
        get foo() {
          return this.program.checker.anyType;
        },
        bar() {
          return this.program.checker.anyType;
        },
      } as any,
    } as any,
  });
  const tk = $(program);

  expect((tk as any).test.foo).toBe(program.checker.anyType);
  expect((tk as any).test.nested.foo).toBe(program.checker.anyType);
  expect((tk as any).test.nested.bar()).toBe(program.checker.anyType);
});
