import { Tester } from "#test/test-host.js";
import { d } from "@alloy-js/core/testing";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getOutput } from "../../test-utils.js";
import { TypeExpression } from "./type-expression.js";

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
  it("[int32, int32] => tuple[int, int]", async () => {
    const { program, Tuple } = await Tester.compile(t.code`
      alias ${t.type("Tuple")} = [int32, int32];
    `);

    expect(getOutput(program, [<TypeExpression type={Tuple} />])).toRenderTo(d`
      tuple[int, int]
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
  it("[int32, int32] => tuple[int, int]", async () => {
    const { program, tupleProperty } = await Tester.compile(t.code`
      model Test {
        ${t.modelProperty("tupleProperty")}: [int32, int32];
      }
    `);

    expect(getOutput(program, [<TypeExpression type={tupleProperty} />])).toRenderTo(d`
      tuple[int, int]
    `);
  });
});

describe("handles UnionVariant types", () => {
  it("renders string union variant as string literal", async () => {
    const { program } = await Tester.compile(t.code`
      union Color {
        red: "red",
        blue: "blue",
      }
      
      model Widget {
        color: Color.red;
      }
    `);

    const Widget = program.resolveTypeReference("Widget")[0]! as any;
    const colorProperty = Widget.properties.get("color");

    expect(getOutput(program, [<TypeExpression type={colorProperty.type} />])).toRenderTo(d`
      "red"
    `);
  });

  it("renders integer union variant as integer literal", async () => {
    const { program } = await Tester.compile(t.code`
      union Status {
        active: 1,
        inactive: 0,
      }
      
      model Widget {
        status: Status.active;
      }
    `);

    const Widget = program.resolveTypeReference("Widget")[0]! as any;
    const statusProperty = Widget.properties.get("status");

    expect(getOutput(program, [<TypeExpression type={statusProperty.type} />])).toRenderTo(d`
      1
    `);
  });

  it("unwraps union variant to reveal the inner type", async () => {
    const { program } = await Tester.compile(t.code`
      union Status {
        active: string,
        inactive: int32,
      }
      
      model Widget {
        status: Status.inactive;
      }
    `);

    const Widget = program.resolveTypeReference("Widget")[0]! as any;
    const statusProperty = Widget.properties.get("status");

    // The UnionVariant should unwrap to reveal int32, not the union itself
    expect(statusProperty.type.kind).toBe("UnionVariant");
    expect(getOutput(program, [<TypeExpression type={statusProperty.type} />])).toRenderTo(d`
      int
    `);
  });

  it("handles union variant in function return type", async () => {
    const { program } = await Tester.compile(t.code`
      union Result {
        success: "success",
        failure: "failure",
      }
      
      op getResult(): Result.success;
    `);

    const getResult = program.resolveTypeReference("getResult")[0]! as any;
    const returnType = getResult.returnType;

    expect(getOutput(program, [<TypeExpression type={returnType} />])).toRenderTo(d`
      "success"
    `);
  });

  it("handles nested union variant types", async () => {
    const { program } = await Tester.compile(t.code`
      union Inner {
        a: string,
        b: int32,
      }
      
      union Outer {
        x: Inner.a,
        y: Inner.b,
      }
      
      model Widget {
        value: Outer.x;
      }
    `);

    const Widget = program.resolveTypeReference("Widget")[0]! as any;
    const valueProperty = Widget.properties.get("value");

    expect(getOutput(program, [<TypeExpression type={valueProperty.type} />])).toRenderTo(d`
      str
    `);
  });
});
