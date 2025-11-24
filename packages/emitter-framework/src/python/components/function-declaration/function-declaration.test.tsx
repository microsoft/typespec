import { getOutput } from "#python/test-utils.js";
import { Tester } from "#test/test-host.js";
import * as py from "@alloy-js/python";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { FunctionDeclaration } from "./function-declaration.js";

describe("Python Function Declaration", () => {
  it("creates a function with single positional param", async () => {
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

  it("creates a function with additional keyword-only parameters", async () => {
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
      def create_person(id: str, *, name: str, age: float) -> str:
        pass
      
      `);
  });

  it("creates a function with additional keyword-only parameters (string shorthand)", async () => {
    const { program, createPerson } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration type={createPerson} parameters={["name", "age"]} />,
      ]),
    ).toRenderTo(`
      def create_person(id: str, *, name, age) -> str:
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
          replaceParameters={true}
        />,
      ]),
    ).toRenderTo(`
      def create_person(*, name, age) -> str:
        pass
      
      `);
  });

  it("creates a function replacing parameters with params having defaults (requires * marker)", async () => {
    const { program, createPerson } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration
          type={createPerson}
          parameters={[
            { name: "name", type: "str", default: <py.Atom jsValue={"alice"} /> },
            { name: "age", type: "int", default: <py.Atom jsValue={30} /> },
          ]}
          replaceParameters={true}
        />,
      ]),
    ).toRenderTo(`
      def create_person(*, name: str = "alice", age: int = 30) -> str:
        pass
      
      `);
  });

  it("creates a function with defaults in raw parameter descriptors", async () => {
    const { program, createPerson } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(id: string, locale: string = "en-US"): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration
          type={createPerson}
          parameters={[
            { name: "limit", type: "int", default: <py.Atom jsValue={10} /> },
            { name: "verbose", type: "bool", default: <py.Atom jsValue={true} /> },
          ]}
        />,
      ]),
    ).toRenderTo(`
      def create_person(id: str, *, locale: str = "en-US", limit: int = 10, verbose: bool = True) -> str:
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
      def create_person(*, required_name: str = "alice", optional_age: int = None) -> str:
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

  it("creates a function with only keyword-only parameters (requires * marker for params with defaults)", async () => {
    const { program, createPerson } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(name: string = "alice", age: int32 = 30): string;
    `);

    expect(getOutput(program, [<FunctionDeclaration type={createPerson} />])).toRenderTo(`
      def create_person(*, name: str = "alice", age: int = 30) -> str:
        pass
      
      `);
  });

  it("creates a function with operation params positional and additional params keyword-only", async () => {
    const { program, createPerson } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(id: string, locale: string = "en-US"): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration
          type={createPerson}
          parameters={[
            { name: "version", type: "int" },
            { name: "debug", type: "bool", default: <py.Atom jsValue={false} /> },
          ]}
        />,
      ]),
    ).toRenderTo(`
      def create_person(id: str, *, version: int, locale: str = "en-US", debug: bool = False) -> str:
        pass
      
      `);
  });

  it("creates a function with TSP params in wrong order (default before required) - reorders correctly", async () => {
    const { program, createPerson } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(locale: string = "en-US", id: string): string;
    `);

    expect(getOutput(program, [<FunctionDeclaration type={createPerson} />])).toRenderTo(`
      def create_person(id: str, *, locale: str = "en-US") -> str:
        pass
      
      `);
  });

  it("creates a function with only positional params when adding params to empty operation", async () => {
    const { program, ping } = await Tester.compile(t.code`
      op ${t.op("ping")}(): string;
    `);

    expect(getOutput(program, [<FunctionDeclaration type={ping} parameters={["name", "age"]} />]))
      .toRenderTo(`
      def ping(name, age) -> str:
        pass
      
      `);
  });

  it("creates a function with multiple positional params", async () => {
    const { program, createPerson } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(id: string, name: string, age: int32): string;
    `);

    expect(getOutput(program, [<FunctionDeclaration type={createPerson} />])).toRenderTo(`
      def create_person(id: str, name: str, age: int) -> str:
        pass
      
      `);
  });

  it("creates a function adding keyword-only params to operation with only positional params", async () => {
    const { program, createPerson } = await Tester.compile(t.code`
      op ${t.op("createPerson")}(id: string, name: string): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration
          type={createPerson}
          parameters={[
            "email",
            { name: "notify", type: "bool", default: <py.Atom jsValue={false} /> },
          ]}
        />,
      ]),
    ).toRenderTo(`
      def create_person(id: str, name: str, *, email, notify: bool = False) -> str:
        pass
      
      `);
  });

  it("creates a function with multiple params with defaults (all keyword-only)", async () => {
    const { program, search } = await Tester.compile(t.code`
      op ${t.op("search")}(
        limit: int32 = 10,
        offset: int32 = 0,
        sortBy: string = "name"
      ): string;
    `);

    expect(getOutput(program, [<FunctionDeclaration type={search} />])).toRenderTo(`
      def search(*, limit: int = 10, offset: int = 0, sort_by: str = "name") -> str:
        pass
      
      `);
  });

  it("creates a function adding params without defaults to operation with only defaults", async () => {
    const { program, search } = await Tester.compile(t.code`
      op ${t.op("search")}(limit: int32 = 10, offset: int32 = 0): string;
    `);

    expect(getOutput(program, [<FunctionDeclaration type={search} parameters={["query"]} />]))
      .toRenderTo(`
      def search(*, query, limit: int = 10, offset: int = 0) -> str:
        pass
      
      `);
  });

  it("creates a function with complex parameter mix", async () => {
    const { program, complexOp } = await Tester.compile(t.code`
      op ${t.op("complexOp")}(
        required1: string,
        required2: int32,
        optional1: string = "default",
        optional2: int32 = 42
      ): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration
          type={complexOp}
          parameters={[
            "additionalRequired",
            { name: "additionalOptional", type: "bool", default: <py.Atom jsValue={true} /> },
          ]}
        />,
      ]),
    ).toRenderTo(`
      def complex_op(required1: str, required2: int, *, additional_required, optional1: str = "default", optional2: int = 42, additional_optional: bool = True) -> str:
        pass
      
      `);
  });

  it("creates a function with single positional param and additional keyword-only", async () => {
    const { program, getUser } = await Tester.compile(t.code`
      op ${t.op("getUser")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration
          type={getUser}
          parameters={[
            { name: "includeDeleted", type: "bool", default: <py.Atom jsValue={false} /> },
          ]}
        />,
      ]),
    ).toRenderTo(`
      def get_user(id: str, *, include_deleted: bool = False) -> str:
        pass
      
      `);
  });

  it("creates a function adding only params with defaults to empty operation", async () => {
    const { program, ping } = await Tester.compile(t.code`
      op ${t.op("ping")}(): string;
    `);

    expect(
      getOutput(program, [
        <FunctionDeclaration
          type={ping}
          parameters={[
            { name: "timeout", type: "int", default: <py.Atom jsValue={30} /> },
            { name: "retries", type: "int", default: <py.Atom jsValue={3} /> },
          ]}
        />,
      ]),
    ).toRenderTo(`
      def ping(*, timeout: int = 30, retries: int = 3) -> str:
        pass
      
      `);
  });
});
