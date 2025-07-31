import { Output } from "@alloy-js/core";
import { SourceFile } from "@alloy-js/python";
import type { Program, Value } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { beforeAll, expect, it } from "vitest";
import { Atom } from "../../index.js";
import { getProgram } from "../../test-host.js";

let program: Program;
beforeAll(async () => {
  program = await getProgram("");
});

it("renders strings", async () => {
  const value = $(program).value.createString("test");

  await testValueExpression(value, `"test"`);
});

/**
 * Helper that renders a value expression and checks the output against the expected value.
 */
async function testValueExpression(value: Value, expected: string) {
  expect(
    <Output>
      <SourceFile path="test.py">
        <Atom value={value} />
      </SourceFile>
    </Output>,
  ).toRenderTo(`${expected}`);
}
