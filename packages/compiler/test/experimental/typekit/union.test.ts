import { expect, it } from "vitest";
import { $ } from "../../../src/experimental/typekit/define-kit.js";
import { Union } from "../../../src/index.js";
import { getTypes } from "./utils.js";

it("can check if the union is extensible", async () => {
  const { Foo, Bar } = await getTypes(
    `
    union Foo {
      string;
      "hi";
      "bye";
    }

    union Bar {
      "hi";
      "bye";
    }
    `,
    ["Foo", "Bar"],
  );

  expect($.union.isExtensible(Foo as Union)).toBe(true);
  expect($.union.isExtensible(Bar as Union)).toBe(false);
});
