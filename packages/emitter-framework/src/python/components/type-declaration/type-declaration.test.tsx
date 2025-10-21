import { Tester } from "#test/test-host.js";
import { d } from "@alloy-js/core/testing";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getOutput } from "../../test-utils.js";
import { TypeDeclaration } from "./type-declaration.jsx";

describe("Python TypeDeclaration dispatcher", () => {
  it("dispatches to EnumDeclaration for enums", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      enum ${t.enum("Foo")} {
        one: 1,
        two: 2,
        three: 3
      }
    `);

    const output = getOutput(program, [<TypeDeclaration type={Foo} />]);
    expect(output).toRenderTo(d`
      from enum import IntEnum

      class Foo(IntEnum):
        ONE = 1
        TWO = 2
        THREE = 3


    `);
  });

  it("dispatches scalars to TypeAliasDeclaration", async () => {
    const { program, MyDate } = await Tester.compile(t.code`
      scalar ${t.scalar("MyDate")} extends utcDateTime;
    `);

    const output = getOutput(program, [<TypeDeclaration type={MyDate} />]);
    expect(output).toRenderTo(d`
      from datetime import datetime
      from typing import TypeAlias

      my_date: TypeAlias = datetime`);
  });

  it("dispatches arrays (model is Array<T>) to type alias with list[T]", async () => {
    const { program, Items } = await Tester.compile(t.code`
      model ${t.model("Items")} is Array<int32>;
    `);

    const output = getOutput(program, [<TypeDeclaration type={Items} />]);
    expect(output).toRenderTo(d`
      from typing import TypeAlias

      items: TypeAlias = list[int]`);
  });
});
