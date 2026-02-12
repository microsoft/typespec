import { Tester } from "#test/test-host.js";
import { SourceFile } from "@alloy-js/typescript";
import { type TesterInstance, t } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { Output } from "../../../src/core/components/output.jsx";
import { ArrowFunction } from "../../../src/typescript/components/arrow-function.jsx";

describe("arrow functions with a `type` prop", () => {
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
          <ArrowFunction type={getName}>console.log("Hello!");</ArrowFunction>
        </SourceFile>
      </Output>,
    ).toRenderTo(`
        (id: string): string => {
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
          <ArrowFunction async type={getName} />
        </SourceFile>
      </Output>,
    ).toRenderTo(`
        async (id: string): Promise<string> => {}
      `);
  });

  it("can append extra parameters with raw params provided", async () => {
    const { getName } = await runner.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <ArrowFunction
            type={getName}
            parameters={[{ name: "additionalParam", type: "number" }]}
          />
        </SourceFile>
      </Output>,
    ).toRenderTo(`
        (additionalParam: number, id: string): string => {}
      `);
  });
});
