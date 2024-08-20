import { expect, it } from "vitest";
import { defineKit } from "../../src/typekit/define-kit.js";
import { createContextMock } from "./utils.js";

it("can define a kit", async () => {
  const one = defineKit(({ context }) => {
    return {
      test() {
        return true;
      },
    };
  });

  const context = await createContextMock();
  expect(one({ context }).test()).toBe(true);
});

it("can combine kits into one", async () => {
  const one = defineKit(({ context }) => {
    return {
      get() {
        return "one";
      },
    };
  });

  const two = defineKit(({ context }) => {
    return {
      get() {
        return "two";
      },
    };
  });

  const context = await createContextMock();
  const both = defineKit({
    one,
    two,
  })(context);

  expect(both.one.get()).toBe("one");
  expect(both.two.get()).toBe("two");
});
