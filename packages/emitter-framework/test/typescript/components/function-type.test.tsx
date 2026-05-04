import { Tester } from "#test/test-host.js";
import { SourceFile } from "@alloy-js/typescript";
import type { Operation } from "@typespec/compiler";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { Output } from "../../../src/core/components/output.jsx";
import { FunctionType } from "../../../src/typescript/index.js";

describe("function types with a `type` prop", () => {
  let runner: TesterInstance;

  beforeEach(async () => {
    runner = await Tester.createInstance();
  });

  it("creates a function type", async () => {
    const { getName } = await runner.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <FunctionType type={getName} />
        </SourceFile>
      </Output>,
    ).toRenderTo(`
        (id: string) => string
      `);
  });

  it("creates an async function type", async () => {
    const { getName } = await runner.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <FunctionType async type={getName} />
        </SourceFile>
      </Output>,
    ).toRenderTo(`
        (id: string) => Promise<string>
      `);
  });

  it("can append extra parameters with raw params provided", async () => {
    const { getName } = (await runner.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `)) as { getName: Operation };

    expect(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <FunctionType type={getName} parameters={[{ name: "additionalParam", type: "number" }]} />
        </SourceFile>
      </Output>,
    ).toRenderTo(`
        (additionalParam: number, id: string) => string
      `);
  });
});
