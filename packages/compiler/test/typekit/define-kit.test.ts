import { expect, it } from "vitest";
import { $, defineKit } from "../../src/typekit/index.js";
import { createContextMock } from "./utils.js";

it("can define a kit", async () => {
  const { program } = await createContextMock();
  defineKit({
    test() {
      return true;
    },
  });

  expect(($(program) as any).test()).toBe(true);
});

it("supports nested kits", async () => {
  const { program } = await createContextMock();
  defineKit({
    __nestedTest: {
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

  // Ensure program isn't wrapped in a proxy
  expect(tk.program).toBe(program);

  expect((tk as any).__nestedTest.foo).toBe(program.checker.anyType);
  expect((tk as any).__nestedTest.nested.foo).toBe(program.checker.anyType);
  expect((tk as any).__nestedTest.nested.bar()).toBe(program.checker.anyType);
});
