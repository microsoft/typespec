import { getOutput } from "#python/test-utils.jsx";
import { Tester } from "#test/test-host.js";
import * as py from "@alloy-js/python";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { FunctionDeclaration } from "./function-declaration.jsx";

describe("Python Function Declaration", () => {
  it("creates a function", async () => {
    const { program, getName } = await Tester.compile(t.code`
      op ${t.op("getName")}(id: string): string;
    `);

    expect(getOutput(program, [<FunctionDeclaration type={getName} />])).toRenderTo(`
      def get_name(id: str) -> str:
        pass
      
      `);
  });

  it("creates an async function", async () => {
    const { program, getName } = await Tester.compile(t.code`
      op ${t.op("getName")}(id: string): string;
    `);

    expect(getOutput(program, [<FunctionDeclaration async type={getName} />])).toRenderTo(`
      async def get_name(id: str) -> str:
        pass
      
      `);
  });

  it("creates a function with a custom name", async () => {
    const { program, getName } = await Tester.compile(t.code`
      op ${t.op("getName")}(id: string): string;
    `);

    expect(getOutput(program, [<FunctionDeclaration name="new_name" type={getName} />]))
      .toRenderTo(`
      def new_name(id: str) -> str:
        pass
      
      `);
  });

  it("creates a function appending extra parameters with raw params provided", async () => {
    const { program, createPerson } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration
          type={createPerson}
          parameters={[
            { name: "name", type: "str" },
            { name: "age", type: "float" },
          ]}
        />,
      ]),
    ).toRenderTo(`
      def create_person(name: str, age: float, id: str) -> str:
        pass
      
      `);
  });

  it("creates a function prepending extra parameters with raw params provided", async () => {
    const { program, createPerson } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration
          type={createPerson}
          parameters={["name", "age"]}
          parametersMode="prepend"
        />,
      ]),
    ).toRenderTo(`
      def create_person(name, age, id: str) -> str:
        pass
      
      `);
  });

  it("creates a function replacing parameters with raw params provided", async () => {
    const { program, createPerson } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration
          type={createPerson}
          parameters={["name", "age"]}
          parametersMode="replace"
        />,
      ]),
    ).toRenderTo(`
      def create_person(name, age) -> str:
        pass
      
      `);
  });

  it("creates a function with defaults in raw parameter descriptors", async () => {
    const { program, createPerson } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration
          type={createPerson}
          parameters={[
            { name: "limit", type: "int", default: <py.Atom jsValue={10} /> },
            { name: "verbose", type: "bool", default: <py.Atom jsValue={true} /> },
          ]}
          parametersMode="prepend"
        />,
      ]),
    ).toRenderTo(`
      def create_person(limit: int = 10, verbose: bool = True, id: str) -> str:
        pass
      
      `);
  });

  it("creates a function building parameters from a model via parametersModel (will replace parameters)", async () => {
    const { program, createPerson, Foo } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(id: string): string;

      model ${t.model("Foo")} {
        name: string;
        age: int32;
      }
    `);

    expect(getOutput(program, [<FunctionDeclaration type={createPerson} parametersModel={Foo} />]))
      .toRenderTo(`
      def create_person(name: str, age: int) -> str:
        pass
      
      `);
  });

  it("creates a function with parametersModel applying defaults and optionals", async () => {
    const { program, createPerson, Foo } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(id: string): string;

      model ${t.model("Foo")} {
        requiredName?: string = "alice";
        optionalAge?: int32;
      }
    `);

    expect(getOutput(program, [<FunctionDeclaration type={createPerson} parametersModel={Foo} />]))
      .toRenderTo(`
      def create_person(required_name: str = "alice", optional_age: int = None) -> str:
        pass
      
      `);
  });

  it("creates a function that replaces parameters with parametersModel even when extras and mode are provided", async () => {
    const { program, createPerson, Foo } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(id: string): string;

      model ${t.model("Foo")} {
        name: string;
        age: int32;
      }
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration
          type={createPerson}
          parametersModel={Foo}
          parameters={["extra"]}
          parametersMode="append"
        />,
      ]),
    ).toRenderTo(`
      def create_person(name: str, age: int) -> str:
        pass
      
      `);
  });

  it("creates a function overriding the return type", async () => {
    const { program, getName } = await Tester.compile(t.code`
      op ${t.op("getName")}(id: string): string;
    `);

    expect(getOutput(program, [<FunctionDeclaration type={getName} returnType="ASpecialString" />]))
      .toRenderTo(`
      def get_name(id: str) -> ASpecialString:
        pass
      
      `);
  });
  it("creates a function with body", async () => {
    const { program, createPerson } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration type={createPerson}>
          <>print("Hello World!")</>
        </FunctionDeclaration>,
      ]),
    ).toRenderTo(`
      def create_person(id: str) -> str:
        print("Hello World!")
      
      `);
  });

  it("creates a function with a doc", async () => {
    const { program, getName } = await Tester.compile(t.code`
      op ${t.op("getName")}(id: string): string;
    `);

    expect(getOutput(program, [<FunctionDeclaration type={getName} doc={"This is a test doc"} />]))
      .toRenderTo(`
      def get_name(id: str) -> str:
        """
        This is a test doc
        """

        pass
      
      `);
  });

  it("creates a function with a multi-paragraph FunctionDoc", async () => {
    const { program, getName } = await Tester.compile(t.code`
      op ${t.op("getName")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration
          type={getName}
          doc={<py.FunctionDoc description={[<>First paragraph</>, <>Second paragraph</>]} />}
        />,
      ]),
    ).toRenderTo(`
      def get_name(id: str) -> str:
        """
        First paragraph

        Second paragraph
        """

        pass
      
      `);
  });

  it("creates a function with doc as string[]", async () => {
    const { program, getName } = await Tester.compile(t.code`
      op ${t.op("getName")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration type={getName} doc={["First paragraph", "Second paragraph"]} />,
      ]),
    ).toRenderTo(`
      def get_name(id: str) -> str:
        """
        First paragraph

        Second paragraph
        """

        pass
      
      `);
  });

  it("creates a function with doc as Children[]", async () => {
    const { program, getName } = await Tester.compile(t.code`
      op ${t.op("getName")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration type={getName} doc={[<>First paragraph</>, <>Second paragraph</>]} />,
      ]),
    ).toRenderTo(`
      def get_name(id: str) -> str:
        """
        First paragraph

        Second paragraph
        """

        pass
      
      `);
  });

  it("creates a function with doc lines (string with newlines)", async () => {
    const { program, getName } = await Tester.compile(t.code`
      op ${t.op("getName")}(id: string): string;
    `);

    expect(getOutput(program, [<FunctionDeclaration type={getName} doc={"Line 1\nLine 2"} />]))
      .toRenderTo(`
      def get_name(id: str) -> str:
        """
        Line 1
        Line 2
        """

        pass
      
      `);
  });

  it("creates a function with no parameters", async () => {
    const { program, ping } = await Tester.compile(t.code`
      op ${t.op("ping")}(): string;
    `);

    expect(getOutput(program, [<FunctionDeclaration type={ping} />])).toRenderTo(`
      def ping() -> str:
        pass
      
      `);
  });

  it("creates a function that returns None for void", async () => {
    const { program, ping } = await Tester.compile(t.code`
      op ${t.op("ping")}(): void;
    `);

    expect(getOutput(program, [<FunctionDeclaration type={ping} />])).toRenderTo(`
      def ping() -> None:
        pass
      
      `);
  });

  it("creates a function that returns Never for never", async () => {
    const { program, abort } = await Tester.compile(t.code`
      op ${t.op("abort")}(): never;
    `);

    expect(getOutput(program, [<FunctionDeclaration type={abort} />])).toRenderTo(`
      from typing import Never

      def abort() -> Never:
        pass
      
      `);
  });

  it("creates a function that correctly handles simple unions", async () => {
    const { program, get } = await Tester.compile(t.code`
      op ${t.op("get")}(): int32 | string;
    `);

    expect(getOutput(program, [<FunctionDeclaration type={get} />])).toRenderTo(`
      def get() -> int | str:
        pass
      
      `);
  });
});
