import { expect, it } from "vitest";
import { $ } from "../../../src/experimental/typekit/index.js";
import { StringLiteral, Union } from "../../../src/index.js";
import { getTypes } from "./utils.js";

it("can create a union", async () => {
  await getTypes(
    `
    model Foo {}
    `,
    ["Foo"],
  );

  const union = $.union.create({
    name: "Foo",
    variants: { hi: "Hello", bye: "Goodbye" },
  });
  expect(union).toBeDefined();
  expect(union.variants.size).toBe(2);
  expect((union.variants.get("hi")?.type as StringLiteral).value).toBe("Hello");
  expect((union.variants.get("bye")?.type as StringLiteral).value).toBe("Goodbye");
});

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
