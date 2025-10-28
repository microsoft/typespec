import { Tester } from "#test/test-host.js";
import { d } from "@alloy-js/core/testing";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getOutput } from "../../test-utils.js";
import { TypeExpression } from "./type-expression.jsx";

describe("map Typespec types to Python built-in types", () => {
  it.each([
    ["unknown", "Any", "from typing import Any"],
    ["string", "str"],
    ["boolean", "bool"],
    ["null", "None"],
    ["void", "None"],
    ["never", "Never", "from typing import Never"],
    ["bytes", "bytes"],
    ["numeric", "number"],
    ["integer", "int"],
    ["float", "float"],
    ["decimal", "Decimal", "from decimal import Decimal"],
    ["decimal128", "Decimal", "from decimal import Decimal"],
    ["int64", "int"],
    ["int32", "int"],
    ["int16", "int"],
    ["int8", "int"],
    ["safeint", "int"],
    ["uint64", "int"],
    ["uint32", "int"],
    ["uint16", "int"],
    ["uint8", "int"],
    ["float32", "float"],
    ["float64", "float"],
    ["plainDate", "str"],
    ["plainTime", "str"],
    ["utcDateTime", "datetime", "from datetime import datetime"],
    ["offsetDateTime", "str"],
    ["duration", "str"],
    ["url", "str"],
  ])("%s => %s", async (tspType, pythonType, extraImport = "") => {
    const { program, Type } = await Tester.compile(t.code`
      alias ${t.type("Type")} = ${t.type(tspType)};
    `);

    expect(getOutput(program, [<TypeExpression type={Type} />])).toRenderTo(d`
      ${extraImport ? `${extraImport}\n\n` : ""}${pythonType}
    `);
  });
});

// TODO: Add extra test for when we have Scalar types defined and with references
describe("map scalar to Python types", () => {
  it("Email => Email", async () => {
    const { program, Email } = await Tester.compile(t.code`
      scalar ${t.scalar("Email")} extends string;
    `);

    expect(getOutput(program, [<TypeExpression type={Email} />])).toRenderTo(d`
      str
    `);
  });
});

describe("map tuple to Python types", () => {
  it("[int32, int32] => Tuple[int, int]", async () => {
    const { program, Tuple } = await Tester.compile(t.code`
      alias ${t.type("Tuple")} = [int32, int32];
    `);

    expect(getOutput(program, [<TypeExpression type={Tuple} />])).toRenderTo(d`
      from typing import Tuple

      Tuple[int, int]
    `);
  });
});

describe("map operation (function type) to typing.Callable", () => {
  it("op f(a: int32, b: string): void => Callable[[int, str], None]", async () => {
    const { program, f } = await Tester.compile(t.code`
      op ${t.op("f")}(a: int32, b: string): void;
    `);

    expect(getOutput(program, [<TypeExpression type={f} />])).toRenderTo(d`
      from typing import Callable

      Callable[[int, str], None]
    `);
  });

  it("op g(): int32 => Callable[[], int]", async () => {
    const { program, g } = await Tester.compile(t.code`
      op ${t.op("g")}(): int32;
    `);

    expect(getOutput(program, [<TypeExpression type={g} />])).toRenderTo(d`
      from typing import Callable

      Callable[[], int]
    `);
  });
});

describe("correctly solves a ModelProperty to Python types", () => {
  it("[int32, int32] => Tuple[int, int]", async () => {
    const { program, tupleProperty } = await Tester.compile(t.code`
      model Test {
        ${t.modelProperty("tupleProperty")}: [int32, int32];
      }
    `);

    expect(getOutput(program, [<TypeExpression type={tupleProperty} />])).toRenderTo(d`
      from typing import Tuple

      Tuple[int, int]
    `);
  });
});
