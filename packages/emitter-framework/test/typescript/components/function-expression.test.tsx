import { render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { SourceFile } from "@alloy-js/typescript";
import type { Operation } from "@typespec/compiler";
import type { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { Output } from "../../../src/core/components/output.jsx";
import { FunctionExpression } from "../../../src/typescript/components/function-expression.jsx";
import { assertFileContents } from "../../utils.js";
import { createEmitterFrameworkTestRunner } from "../test-host.js";

describe("function expressions with a `type` prop", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createEmitterFrameworkTestRunner();
  });

  it("creates a function", async () => {
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
    `)) as { getName: Operation };

    const res = render(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <FunctionExpression type={getName}>console.log("Hello!");</FunctionExpression>
        </SourceFile>
      </Output>,
    );

    assertFileContents(
      res,
      d`
        function (id: string): string {
          console.log("Hello!");
        }
      `,
    );
  });

  it("creates an async function", async () => {
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
    `)) as { getName: Operation };

    const res = render(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <FunctionExpression async type={getName} />
        </SourceFile>
      </Output>,
    );

    assertFileContents(
      res,
      d`
        async function (id: string): Promise<string> {}
      `,
    );
  });

  it("can append extra parameters with raw params provided", async () => {
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
    `)) as { getName: Operation };

    const res = render(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <FunctionExpression
            type={getName}
            parameters={[{ name: "additionalParam", type: "number" }]}
          />
        </SourceFile>
      </Output>,
    );

    assertFileContents(
      res,
      d`
        function (additionalParam: number, id: string): string {}
      `,
    );
  });
});
