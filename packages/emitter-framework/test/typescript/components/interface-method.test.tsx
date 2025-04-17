import { Output, render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { InterfaceDeclaration, SourceFile } from "@alloy-js/typescript";
import { Operation } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { InterfaceMethod } from "../../../src/typescript/components/interface-method.jsx";
import { assertFileContents } from "../../utils.js";
import { createEmitterFrameworkTestRunner } from "../test-host.js";

describe("interface methods with a `type` prop", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createEmitterFrameworkTestRunner();
  });

  it("creates a interface member", async () => {
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
    `)) as { getName: Operation };

    const res = render(
      <Output>
        <SourceFile path="test.ts">
          <InterfaceDeclaration name="basicInterface">
            <InterfaceMethod type={getName} name={getName.name} />
          </InterfaceDeclaration>
        </SourceFile>
      </Output>,
    );

    assertFileContents(
      res,
      d`
        interface basicInterface {
          getName(id: string): string
        }
      `,
    );
  });

  it("creates an async interface function", async () => {
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
    `)) as { getName: Operation };

    const res = render(
      <Output>
        <SourceFile path="test.ts">
          <InterfaceDeclaration name="basicInterface">
            <InterfaceMethod async type={getName} />
          </InterfaceDeclaration>
        </SourceFile>
      </Output>,
    );

    assertFileContents(
      res,
      d`
        interface basicInterface {
          getName(id: string): Promise<string>
        }
      `,
    );
  });

  it.todo("can append extra parameters with raw params provided", async () => {});
});
