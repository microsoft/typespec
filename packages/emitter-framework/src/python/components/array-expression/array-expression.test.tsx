import { render, type Children } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { SourceFile } from "@alloy-js/python";
import type { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { Output } from "../../../../src/core/components/output.jsx";
import { createEmitterFrameworkTestRunner } from "../../test-host.js";
import { assertFileContents, compileModelPropertyType, getExternals } from "../../test-utils.js";
import { TypeExpression } from "../type-expression/type-expression.jsx";

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

describe("map array expression to Python list", () => {
  it.each([["string[]", "list[str]"]])("%s => %s", async (tspType, pythonType) => {
    const type = await compileModelPropertyType(tspType, runner);
    const res = render(
      <Wrapper>
        <TypeExpression type={type} />
      </Wrapper>,
    );

    assertFileContents(
      res,
      d`
          ${pythonType}
        `,
    );
  });
});
