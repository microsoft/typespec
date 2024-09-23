import { it } from "vitest";
import { Model } from "../../../src/core/types.js";
import { $ } from "../../../src/experimental/typekit/index.js";
import { getTypes } from "./utils.js";

it("should clone a model", async () => {
  const { Foo } = await getTypes(
    `
      model Foo {
        props: string;
      }
      `,
    ["Foo"],
  );

  const clone = $.type.clone(Foo) as Model;
  clone.properties.get("props")!.name = "props";
});
