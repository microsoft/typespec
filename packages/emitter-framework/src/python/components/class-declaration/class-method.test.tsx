import { Tester } from "#test/test-host.js";
import { getProgram } from "#test/utils.js";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { ClassDeclaration } from "../../../../src/python/components/class-declaration/class-declaration.js";
import { Method } from "../../../../src/python/components/class-declaration/class-method.js";
import { getOutput } from "../../test-utils.jsx";

describe("interface methods with a `type` prop", () => {
  it("creates a class method from an interface method", async () => {
    const { program, getName } = await Tester.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration name="basicInterface">
          <Method async type={getName} />
        </ClassDeclaration>,
      ]),
    ).toRenderTo(`
      class BasicInterface:
        async def get_name(self, id: str) -> str:
          pass


    `);
  });

  it("creates a class method that is a classmethod", async () => {
    const { program, getName } = await Tester.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration name="basicInterface">
          <Method async type={getName} methodType="class" />
        </ClassDeclaration>,
      ]),
    ).toRenderTo(`
      class BasicInterface:
        @classmethod
        async def get_name(cls, id: str) -> str:
          pass


    `);
  });

  it("creates a class method that is a staticmethod", async () => {
    const { program, getName } = await Tester.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration name="basicInterface">
          <Method async type={getName} methodType="static" />
        </ClassDeclaration>,
      ]),
    ).toRenderTo(`
      class BasicInterface:
        @staticmethod
        async def get_name(id: str) -> str:
          pass


    `);
  });

  it("creates an async class method from an asyncinterface method", async () => {
    const { program, getName } = await Tester.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration name="basicInterface">
          <Method async type={getName} />
        </ClassDeclaration>,
      ]),
    ).toRenderTo(`
      class BasicInterface:
        async def get_name(self, id: str) -> str:
          pass


    `);
  });

  it("can append extra parameters with raw params provided", async () => {
    const { program, getName } = await Tester.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration name="basicInterface">
          <Method
            type={getName}
            parametersMode="append"
            parameters={[{ name: "foo", type: "string" }]}
          />
        </ClassDeclaration>,
      ]),
    ).toRenderTo(`
      class BasicInterface:
        def get_name(self, id: str, foo: str) -> str:
          pass


      `);
  });

  it("can prepend extra parameters with raw params provided", async () => {
    const { program, getName } = await Tester.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration name="basicInterface">
          <Method
            type={getName}
            parametersMode="prepend"
            parameters={[{ name: "foo", type: "string" }]}
          />
        </ClassDeclaration>,
      ]),
    ).toRenderTo(`
      class BasicInterface:
        def get_name(self, foo: str, id: str) -> str:
          pass


      `);
  });

  it("can replace parameters with raw params provided", async () => {
    const { program, getName } = await Tester.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration name="basicInterface">
          <Method
            type={getName}
            parametersMode="replace"
            parameters={[
              { name: "foo", type: "string" },
              { name: "bar", type: "number" },
            ]}
          />
        </ClassDeclaration>,
      ]),
    ).toRenderTo(`
      class BasicInterface:
        def get_name(self, foo: str, bar: float) -> str:
          pass


      `);
  });

  it("can override return type in a class method", async () => {
    const { program, getName } = await Tester.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration name="basicInterface">
          <Method type={getName} returnType="ASpecialString" />
        </ClassDeclaration>,
      ]),
    ).toRenderTo(`
      class BasicInterface:
        def get_name(self, id: str) -> ASpecialString:
          pass


      `);
  });

  it("can override method name in a class method", async () => {
    const { program, getName } = await Tester.compile(t.code`
      @test op ${t.op("getName")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration name="basicInterface">
          <Method type={getName} name="get_name_custom" />
        </ClassDeclaration>,
      ]),
    ).toRenderTo(`
      class BasicInterface:
        def get_name_custom(self, id: str) -> str:
          pass


      `);
  });
});

describe("interface methods without a `type` prop", () => {
  it("renders a plain interface method from a class method without a `type` prop", async () => {
    const program = await getProgram("");

    expect(
      getOutput(program, [
        <ClassDeclaration name="basicInterface">
          <Method
            name="plainMethod"
            parameters={[{ name: "param1", type: "string" }]}
            returnType="number"
          />
        </ClassDeclaration>,
      ]),
    ).toRenderTo(`
      class BasicInterface:
        def plain_method(self, param1: string) -> number:
          pass


      `);
  });
});
