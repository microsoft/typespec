import { render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { InterfaceDeclaration, SourceFile } from "@alloy-js/typescript";
import type { Operation } from "@typespec/compiler";
import type { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { Output } from "../../../src/core/components/output.jsx";
import { InterfaceMethod } from "../../../src/typescript/components/interface-method.jsx";
import { assertFileContents } from "../../utils.js";
import { createEmitterFrameworkTestRunner, getProgram } from "../test-host.js";

describe("interface methods with a `type` prop", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createEmitterFrameworkTestRunner();
  });

  it("creates a interface method", async () => {
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
    `)) as { getName: Operation };

    const res = render(
      <Output program={runner.program}>
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
      <Output program={runner.program}>
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

  it("can append extra parameters with raw params provided", async () => {
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
    `)) as { getName: Operation };

    const res = render(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <InterfaceDeclaration name="basicInterface">
            <InterfaceMethod
              type={getName}
              parametersMode="append"
              parameters={[{ name: "foo", type: "string" }]}
            />
          </InterfaceDeclaration>
        </SourceFile>
      </Output>,
    );

    assertFileContents(
      res,
      d`
        interface basicInterface {
          getName(id: string, foo: string): string
        }
      `,
    );
  });

  it("can prepend extra parameters with raw params provided", async () => {
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
    `)) as { getName: Operation };

    const res = render(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <InterfaceDeclaration name="basicInterface">
            <InterfaceMethod
              type={getName}
              parametersMode="prepend"
              parameters={[{ name: "foo", type: "string" }]}
            />
          </InterfaceDeclaration>
        </SourceFile>
      </Output>,
    );

    assertFileContents(
      res,
      d`
        interface basicInterface {
          getName(foo: string, id: string): string
        }
      `,
    );
  });

  it("can replace parameters with raw params provided", async () => {
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
    `)) as { getName: Operation };

    const res = render(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <InterfaceDeclaration name="basicInterface">
            <InterfaceMethod
              type={getName}
              parametersMode="replace"
              parameters={[
                { name: "foo", type: "string" },
                { name: "bar", type: "number" },
              ]}
            />
          </InterfaceDeclaration>
        </SourceFile>
      </Output>,
    );

    assertFileContents(
      res,
      d`
        interface basicInterface {
          getName(foo: string, bar: number): string
        }
      `,
    );
  });

  it("can override return type", async () => {
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
    `)) as { getName: Operation };

    const res = render(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <InterfaceDeclaration name="basicInterface">
            <InterfaceMethod type={getName} returnType="Promise<Record<string, unknown>>" />
          </InterfaceDeclaration>
        </SourceFile>
      </Output>,
    );

    assertFileContents(
      res,
      d`
        interface basicInterface {
          getName(id: string): Promise<Record<string, unknown>>
        }
      `,
    );
  });

  it("can override method name", async () => {
    const { getName } = (await runner.compile(`
      @test op getName(id: string): string;
    `)) as { getName: Operation };

    const res = render(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <InterfaceDeclaration name="basicInterface">
            <InterfaceMethod type={getName} name="getNameCustom" />
          </InterfaceDeclaration>
        </SourceFile>
      </Output>,
    );

    assertFileContents(
      res,
      d`
        interface basicInterface {
          getNameCustom(id: string): string
        }
      `,
    );
  });
});

describe("interface methods without a `type` prop", () => {
  it("renders a plain interface method", async () => {
    const program = await getProgram("");
    const res = render(
      <Output program={program}>
        <SourceFile path="test.ts">
          <InterfaceDeclaration name="basicInterface">
            <InterfaceMethod
              name="plainMethod"
              parameters={[{ name: "param1", type: "string" }]}
              returnType="number"
            />
          </InterfaceDeclaration>
        </SourceFile>
      </Output>,
    );

    assertFileContents(
      res,
      d`
        interface basicInterface {
          plainMethod(param1: string): number
        }
      `,
    );
  });
});
