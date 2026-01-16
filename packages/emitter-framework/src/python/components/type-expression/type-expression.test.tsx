import { Tester } from "#test/test-host.js";
import { d } from "@alloy-js/core/testing";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getOutput } from "../../test-utils.js";
import { EnumDeclaration } from "../enum-declaration/enum-declaration.js";
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
      ${extraImport ? `${extraImport}\n\n\n` : ""}${pythonType}
    `);
  });
});

describe("map scalar to Python types", () => {
  it("Email => str (scalars are inlined to base type)", async () => {
    const { program, Email } = await Tester.compile(t.code`
      scalar ${t.scalar("Email")} extends string;
    `);

    expect(getOutput(program, [<TypeExpression type={Email} />])).toRenderTo(d`
      str
    `);
  });

  it("PhoneNumber => str (scalar in model property is inlined)", async () => {
    const { program, _ } = await Tester.compile(t.code`
      scalar PhoneNumber extends string;
      
      model ${t.model("Widget")} {
        phone: PhoneNumber;
      }
    `);

    const phoneProperty = program.resolveTypeReference("Widget")[0]!;
    const phoneProp = (phoneProperty as any).properties.get("phone");

    expect(getOutput(program, [<TypeExpression type={phoneProp.type} />])).toRenderTo(d`
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
  it("renders named union variant with literal value as Literal[Union.MEMBER]", async () => {
    const { program, Color } = await Tester.compile(t.code`
      union ${t.union("Color")} {
        red: "red",
        blue: "blue",
      }
      
      model Widget {
        color: Color.red;
      }
    `);

    const Widget = program.resolveTypeReference("Widget")[0]! as any;
    const colorProperty = Widget.properties.get("color");

    expect(
      getOutput(program, [
        <EnumDeclaration type={Color} />,
        <TypeExpression type={colorProperty.type} />,
      ]),
    ).toRenderTo(d`
      from enum import StrEnum
      from typing import Literal


      class Color(StrEnum):
        RED = "red"
        BLUE = "blue"


      Literal[Color.RED]
    `);
  });

  it("renders named union variant with integer literal as Literal[Union.MEMBER]", async () => {
    const { program, Status } = await Tester.compile(t.code`
      union ${t.union("Status")} {
        active: 1,
        inactive: 0,
      }
      
      model Widget {
        status: Status.active;
      }
    `);

    const Widget = program.resolveTypeReference("Widget")[0]! as any;
    const statusProperty = Widget.properties.get("status");

    expect(
      getOutput(program, [
        <EnumDeclaration type={Status} />,
        <TypeExpression type={statusProperty.type} />,
      ]),
    ).toRenderTo(d`
      from enum import IntEnum
      from typing import Literal


      class Status(IntEnum):
        ACTIVE = 1
        INACTIVE = 0


      Literal[Status.ACTIVE]
    `);
  });

  it("unwraps union variant with non-literal type to reveal the inner type", async () => {
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

    // The UnionVariant should unwrap to reveal int32 (non-literal type)
    expect(statusProperty.type.kind).toBe("UnionVariant");
    expect(getOutput(program, [<TypeExpression type={statusProperty.type} />])).toRenderTo(d`
      int
    `);
  });

  it("handles named union variant in function return type", async () => {
    const { program, Result } = await Tester.compile(t.code`
      union ${t.union("Result")} {
        success: "success",
        failure: "failure",
      }
      
      op getResult(): Result.success;
    `);

    const getResult = program.resolveTypeReference("getResult")[0]! as any;
    const returnType = getResult.returnType;

    expect(
      getOutput(program, [<EnumDeclaration type={Result} />, <TypeExpression type={returnType} />]),
    ).toRenderTo(d`
      from enum import StrEnum
      from typing import Literal


      class Result(StrEnum):
        SUCCESS = "success"
        FAILURE = "failure"


      Literal[Result.SUCCESS]
    `);
  });

  it("unwraps nested union variant with non-literal inner types", async () => {
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

    // Inner.a has type `string` (not a literal), so it unwraps
    expect(getOutput(program, [<TypeExpression type={valueProperty.type} />])).toRenderTo(d`
      str
    `);
  });
});

describe("handles literal types", () => {
  it("renders union of string literals as Literal[...]", async () => {
    const { program } = await Tester.compile(t.code`
      model Widget {
        status: "active" | "inactive" | "pending";
      }
    `);

    const Widget = program.resolveTypeReference("Widget")[0]! as any;
    const statusProperty = Widget.properties.get("status");

    expect(getOutput(program, [<TypeExpression type={statusProperty.type} />])).toRenderTo(d`
      from typing import Literal


      Literal["active", "inactive", "pending"]
    `);
  });

  it("renders union of integer literals as Literal[...]", async () => {
    const { program } = await Tester.compile(t.code`
      model Widget {
        priority: 1 | 2 | 3;
      }
    `);

    const Widget = program.resolveTypeReference("Widget")[0]! as any;
    const priorityProperty = Widget.properties.get("priority");

    expect(getOutput(program, [<TypeExpression type={priorityProperty.type} />])).toRenderTo(d`
      from typing import Literal


      Literal[1, 2, 3]
    `);
  });

  it("renders union of boolean literals as Literal[...]", async () => {
    const { program } = await Tester.compile(t.code`
      model Widget {
        flag: true | false;
      }
    `);

    const Widget = program.resolveTypeReference("Widget")[0]! as any;
    const flagProperty = Widget.properties.get("flag");

    expect(getOutput(program, [<TypeExpression type={flagProperty.type} />])).toRenderTo(d`
      from typing import Literal


      Literal[True, False]
    `);
  });

  it("renders mixed literal union as Literal[...]", async () => {
    const { program } = await Tester.compile(t.code`
      model Widget {
        value: "auto" | 0 | 100;
      }
    `);

    const Widget = program.resolveTypeReference("Widget")[0]! as any;
    const valueProperty = Widget.properties.get("value");

    expect(getOutput(program, [<TypeExpression type={valueProperty.type} />])).toRenderTo(d`
      from typing import Literal


      Literal["auto", 0, 100]
    `);
  });

  it("renders function returning literal union as Literal[...]", async () => {
    const { program } = await Tester.compile(t.code`
      op getStatus(): "success" | "failure";
    `);

    const getStatus = program.resolveTypeReference("getStatus")[0]! as any;

    expect(getOutput(program, [<TypeExpression type={getStatus.returnType} />])).toRenderTo(d`
      from typing import Literal


      Literal["success", "failure"]
    `);
  });

  it("renders single string literal as Literal[...]", async () => {
    const { program } = await Tester.compile(t.code`
      model Widget {
        constant: "fixed-value";
      }
    `);

    const Widget = program.resolveTypeReference("Widget")[0]! as any;
    const constantProperty = Widget.properties.get("constant");

    expect(getOutput(program, [<TypeExpression type={constantProperty.type} />])).toRenderTo(d`
      from typing import Literal


      Literal["fixed-value"]
    `);
  });

  it("renders function returning single string literal as Literal[...]", async () => {
    const { program } = await Tester.compile(t.code`
      op getSteve(): "steve";
    `);

    const getSteve = program.resolveTypeReference("getSteve")[0]! as any;

    expect(getOutput(program, [<TypeExpression type={getSteve.returnType} />])).toRenderTo(d`
      from typing import Literal


      Literal["steve"]
    `);
  });

  it("renders single numeric literal as Literal[...]", async () => {
    const { program } = await Tester.compile(t.code`
      op getAnswer(): 42;
    `);

    const getAnswer = program.resolveTypeReference("getAnswer")[0]! as any;

    expect(getOutput(program, [<TypeExpression type={getAnswer.returnType} />])).toRenderTo(d`
      from typing import Literal


      Literal[42]
    `);
  });

  it("renders single boolean literal as Literal[...]", async () => {
    const { program } = await Tester.compile(t.code`
      op isEnabled(): true;
    `);

    const isEnabled = program.resolveTypeReference("isEnabled")[0]! as any;

    expect(getOutput(program, [<TypeExpression type={isEnabled.returnType} />])).toRenderTo(d`
      from typing import Literal


      Literal[True]
    `);
  });

  it("renders union with non-literal types as regular union", async () => {
    const { program } = await Tester.compile(t.code`
      model Widget {
        value: string | int32;
      }
    `);

    const Widget = program.resolveTypeReference("Widget")[0]! as any;
    const valueProperty = Widget.properties.get("value");

    // Mixed literal and non-literal types render as regular union
    expect(getOutput(program, [<TypeExpression type={valueProperty.type} />])).toRenderTo(d`
      str | int
    `);
  });

  it("renders function with literal parameter type", async () => {
    const { program } = await Tester.compile(t.code`
      op setMode(mode: "auto" | "manual"): void;
    `);

    const setMode = program.resolveTypeReference("setMode")[0]! as any;
    const modeParam = setMode.parameters.properties.get("mode");

    expect(getOutput(program, [<TypeExpression type={modeParam.type} />])).toRenderTo(d`
      from typing import Literal


      Literal["auto", "manual"]
    `);
  });
});
