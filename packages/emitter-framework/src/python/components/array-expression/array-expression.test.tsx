import { d } from "@alloy-js/core/testing";
import type { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { createEmitterFrameworkTestRunner } from "../../test-host.js";
import { compileModelPropertyType, getOutput } from "../../test-utils.js";
import { TypeExpression } from "../type-expression/type-expression.jsx";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createEmitterFrameworkTestRunner();
});

describe("map array expression to Python list", () => {
  it.each([["string[]", "list[str]"]])("%s => %s", async (tspType, pythonType) => {
    const type = await compileModelPropertyType(tspType, runner);

    expect(getOutput(runner.program, [<TypeExpression type={type} />])).toRenderTo(d`
      ${pythonType}
    `);
  });
});
