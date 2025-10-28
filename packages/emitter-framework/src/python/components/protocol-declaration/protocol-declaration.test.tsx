import { TypeExpression } from "#python/components/type-expression/type-expression.jsx";
import { Tester } from "#test/test-host.js";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getOutput } from "../../test-utils.js";
import { ProtocolDeclaration } from "./protocol-declaration.jsx";

describe("Python ProtocolDeclaration", () => {
  it("emits a callback Protocol for an operation", async () => {
    const { program, getName, getOtherName } = await Tester.compile(t.code`
      op ${t.op("getName")}(id: string): string;
      op ${t.op("getOtherName")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <ProtocolDeclaration type={getName} />,
        <ProtocolDeclaration type={getOtherName} />,
      ]),
    ).toRenderTo(`
      from typing import Protocol

      class GetName(Protocol):
        def __call__(self, id: str) -> str:
          ...



      class GetOtherName(Protocol):
        def __call__(self, id: str) -> str:
          ...


      `);
  });

  it("emits no return annotation when return type omitted", async () => {
    const { program, getName } = await Tester.compile(t.code`
      op ${t.op("getName")}(id: string): string;
    `);

    // Create a shallow clone without returnType to simulate missing return info
    const getNameNoReturn: any = { ...(getName as any) };
    delete getNameNoReturn.returnType;

    expect(getOutput(program, [<ProtocolDeclaration type={getNameNoReturn} />])).toRenderTo(`
      from typing import Protocol

      class GetName(Protocol):
        def __call__(self, id: str):
          ...

      
      `);
  });

  it("emits a Protocol for a TypeSpec interface (methods only)", async () => {
    const { program, Greeter } = await Tester.compile(t.code`
      interface ${t.interface("Greeter")} {
        op getName(id: string): string;
        op getOtherName(id: string): string;
      }
    `);

    expect(getOutput(program, [<ProtocolDeclaration type={Greeter} />])).toRenderTo(`
      from typing import Protocol

      class Greeter(Protocol):
        def get_name(self, id: str) -> str:
          ...

        def get_other_name(self, id: str) -> str:
          ...
      
      
      `);
  });

  it("emits both a Protocol and a Callable for the same operation", async () => {
    const { program, getName } = await Tester.compile(t.code`
      op ${t.op("getName")}(id: string): string;
    `);

    expect(
      getOutput(program, [
        <ProtocolDeclaration type={getName} />,
        <TypeExpression type={getName} />,
      ]),
    ).toRenderTo(`
      from typing import Callable
      from typing import Protocol

      class GetName(Protocol):
        def __call__(self, id: str) -> str:
          ...

      
      
      Callable[[str], str]
      `);
  });
});
