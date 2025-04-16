import { expect, it } from "vitest";
import { $, defineKit } from "../../../src/experimental/typekit/index.js";
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
