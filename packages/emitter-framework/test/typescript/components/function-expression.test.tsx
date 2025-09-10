import { Tester } from "#test/test-host.js";
import { SourceFile } from "@alloy-js/typescript";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { Output } from "../../../src/core/components/output.jsx";
import { FunctionExpression } from "../../../src/typescript/components/function-expression.jsx";

describe("function expressions with a `type` prop", () => {
  let runner: TesterInstance;

  beforeEach(async () => {
    runner = await Tester.createInstance();
  });

  it("creates a function", async () => {
    const { getName } = await runner.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <FunctionExpression type={getName}>console.log("Hello!");</FunctionExpression>
        </SourceFile>
      </Output>,
    ).toRenderTo(`
        function (id: string): string {
          console.log("Hello!");
        }
      `);
  });

  it("creates an async function", async () => {
    const { getName } = await runner.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <FunctionExpression async type={getName} />
        </SourceFile>
      </Output>,
    ).toRenderTo(`
        async function (id: string): Promise<string> {}
      `);
  });

  it("can append extra parameters with raw params provided", async () => {
    const { getName } = await runner.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <FunctionExpression
            type={getName}
            parameters={[{ name: "additionalParam", type: "number" }]}
          />
        </SourceFile>
      </Output>,
    ).toRenderTo(`
        function (additionalParam: number, id: string): string {}
      `);
  });
});
