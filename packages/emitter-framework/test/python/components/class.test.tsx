import { d } from "@alloy-js/core/testing";
import { expect, it } from "vitest";
import { ClassDeclaration, PythonModule, PythonPackage } from "../../../src/python/index.js";
import { Model } from "@typespec/compiler";
import { getEmitOutput } from "../utils.js";
import { mapJoin } from "@alloy-js/core";

async function getOutput(code: string, names: string[]): Promise<string | undefined> {
  const output = await getEmitOutput(code, (program) => {
    const classComponents = mapJoin(names, (name => <ClassDeclaration type={program.resolveTypeReference(name)[0]! as Model} />), { joiner: "\n\n" });
    return (
      <PythonPackage name="test_package">
        <PythonModule name="test.py">
          {classComponents}
        </PythonModule>
      </PythonPackage>
    )
  });
  if (typeof output === "string") {
    return output.trim();
  }
  return undefined;
}

it("empty class", async () => {
  const code = `
    model TestClass {}
  `;
  const output = await getOutput(code, ["TestClass"]);
  expect(output).toBe(d`
    class TestClass:
      pass
  `);
});

it("single base class", async () => {
  const code = `
    model Foo {}

    model TestClass extends Foo {}
  `;
  const output = await getOutput(code, ["Foo", "TestClass"]);
  expect(output).toBe(d`
    class Foo:
      pass

    class TestClass(Foo):
      pass
  `);
});

it("with instance variables", async () => {
  const code = `
    model TestClass {
      fooVar: string;
      barVar: int16;
    }
  `;
  const output = await getOutput(code, ["TestClass"]);
  expect(output).toBe(d`
    class TestClass:
      def __init__(self, foo_var: str, bar_var: int):
        self.foo_var = foo_var
        self.bar_var = bar_var
  `);
});
