import { Tester } from "#test/test-host.js";
import { getProgram } from "#test/utils.js";
import { InterfaceDeclaration, SourceFile } from "@alloy-js/typescript";
import type { Operation } from "@typespec/compiler";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { Output } from "../../../src/core/components/output.jsx";
import { InterfaceMethod } from "../../../src/typescript/components/interface-method.jsx";

describe("interface methods with a `type` prop", () => {
  let runner: TesterInstance;

  beforeEach(async () => {
    runner = await Tester.createInstance();
  });

  it("creates a interface method", async () => {
    const { getName } = (await runner.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `)) as { getName: Operation };

    expect(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <InterfaceDeclaration name="basicInterface">
            <InterfaceMethod type={getName} name={getName.name} />
          </InterfaceDeclaration>
        </SourceFile>
      </Output>,
    ).toRenderTo(`
        interface basicInterface {
          getName(id: string): string
        }
      `);
  });

  it("creates an async interface function", async () => {
    const { getName } = await runner.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <InterfaceDeclaration name="basicInterface">
            <InterfaceMethod async type={getName} />
          </InterfaceDeclaration>
        </SourceFile>
      </Output>,
    ).toRenderTo(`
        interface basicInterface {
          getName(id: string): Promise<string>
        }
      `);
  });

  it("can append extra parameters with raw params provided", async () => {
    const { getName } = await runner.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
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
    ).toRenderTo(`
        interface basicInterface {
          getName(id: string, foo: string): string
        }
      `);
  });

  it("can prepend extra parameters with raw params provided", async () => {
    const { getName } = await runner.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
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
    ).toRenderTo(`
        interface basicInterface {
          getName(foo: string, id: string): string
        }
      `);
  });

  it("can replace parameters with raw params provided", async () => {
    const { getName } = await runner.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
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
    ).toRenderTo(`
        interface basicInterface {
          getName(foo: string, bar: number): string
        }
      `);
  });

  it("can override return type", async () => {
    const { getName } = await runner.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <InterfaceDeclaration name="basicInterface">
            <InterfaceMethod type={getName} returnType="Promise<Record<string, unknown>>" />
          </InterfaceDeclaration>
        </SourceFile>
      </Output>,
    ).toRenderTo(`
        interface basicInterface {
          getName(id: string): Promise<Record<string, unknown>>
        }
      `);
  });

  it("can override method name", async () => {
    const { getName } = await runner.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      <Output program={runner.program}>
        <SourceFile path="test.ts">
          <InterfaceDeclaration name="basicInterface">
            <InterfaceMethod type={getName} name="getNameCustom" />
          </InterfaceDeclaration>
        </SourceFile>
      </Output>,
    ).toRenderTo(`
        interface basicInterface {
          getNameCustom(id: string): string
        }
      `);
  });
});

describe("interface methods without a `type` prop", () => {
  it("renders a plain interface method", async () => {
    const program = await getProgram("");
    expect(
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
    ).toRenderTo(`
        interface basicInterface {
          plainMethod(param1: string): number
        }
      `);
  });
});
