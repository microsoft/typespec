import { SourceFile } from "@alloy-js/typescript";
import type { Operation } from "@typespec/compiler";
import type { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { Output } from "../../../src/core/components/output.jsx";
import { FunctionType } from "../../../src/typescript/index.js";
import { createEmitterFrameworkTestRunner } from "../test-host.js";

describe("function types with a `type` prop", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createEmitterFrameworkTestRunner();
  });

  it("creates a function type", async () => {
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
    `)) as { getName: Operation };

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
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
    `)) as { getName: Operation };

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
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
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
