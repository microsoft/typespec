import { expect, it } from "vitest";
import { $, defineKit } from "../../src/typekit/define-kit.js";

it("can define a kit", async () => {
  defineKit({
    test() {
      return true;
    },
  });

  expect(($ as any).test()).toBe(true);
});
