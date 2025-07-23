import { render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { SourceFile } from "@alloy-js/typescript";
import type { Operation } from "@typespec/compiler";
import type { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { Output } from "../../../src/core/components/output.jsx";
import { ArrowFunction } from "../../../src/typescript/components/arrow-function.jsx";
import { assertFileContents } from "../../utils.js";
import { createEmitterFrameworkTestRunner } from "../test-host.js";

describe("arrow functions with a `type` prop", () => {
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
          <ArrowFunction type={getName}>console.log("Hello!");</ArrowFunction>
        </SourceFile>
      </Output>,
    );

    assertFileContents(
      res,
      d`
        (id: string): string => {
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
          <ArrowFunction async type={getName} />
        </SourceFile>
      </Output>,
    );

    assertFileContents(
      res,
      d`
        async (id: string): Promise<string> => {}
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
          <ArrowFunction
            type={getName}
            parameters={[{ name: "additionalParam", type: "number" }]}
          />
        </SourceFile>
      </Output>,
    );

    assertFileContents(
      res,
      d`
        (additionalParam: number, id: string): string => {}
      `,
    );
  });
});
