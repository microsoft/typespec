import { render, type Children } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { SourceFile } from "@alloy-js/python";
import type { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { Output } from "../../../../src/core/components/output.jsx";
import { createEmitterFrameworkTestRunner } from "../../test-host.js";
import {
  assertFileContents,
  compileCodeModelPropertyType,
  compileModelProperty,
  compileModelPropertyType,
  getExternals,
} from "../../test-utils.js";
import { TypeExpression } from "./type-expression.jsx";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createEmitterFrameworkTestRunner();
});

function Wrapper(props: { children: Children }) {
  return (
    <Output program={runner.program} externals={getExternals()}>
      <SourceFile path="test.py">{props.children}</SourceFile>
    </Output>
  );
}

describe("map Typespec types to Python built-in types", () => {
  it.each([
    ["unknown", "Any", "from typing import Any"],
    ["string", "str"],
    ["boolean", "bool"],
    ["null", "None"],
    ["void", "None"],
    ["never", "NoReturn", "from typing import NoReturn"],
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
    const type = await compileModelPropertyType(tspType, runner);
    const res = render(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    );
    const extraImportText = extraImport ? `${extraImport}\n\n` : "";

    assertFileContents(
      res,
      d`
          ${extraImportText}${pythonType}
        `,
    );
  });
});

// TODO: Add extra test for when we have Scalar types defined and with references
describe("map scalar to Python types", () => {
  it("Email => Email", async () => {
    const type = await compileCodeModelPropertyType(
      d`
      scalar Email extends string;
      model Test {
        @test test: Email;
      }
    `,
      runner,
    );
    const res = render(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    );

    assertFileContents(
      res,
      d`
          ${"str"}
        `,
    );
  });
});

describe("map tuple to Python types", () => {
  it.each([["[int32, int32]", "Tuple[int, int]"]])("%s => %s", async (tspType, pythonType) => {
    const type = await compileModelPropertyType(tspType, runner);
    const res = render(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    );

    assertFileContents(
      res,
      d`
          from typing import Tuple

          ${pythonType}
        `,
    );
  });
});

describe("correctly solves a ModelProperty to Python types", () => {
  it.each([["[int32, int32]", "Tuple[int, int]"]])("%s => %s", async (tspType, pythonType) => {
    const type = await compileModelProperty(tspType, runner);
    const res = render(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    );

    assertFileContents(
      res,
      d`
          from typing import Tuple

          ${pythonType}
        `,
    );
  });
});
