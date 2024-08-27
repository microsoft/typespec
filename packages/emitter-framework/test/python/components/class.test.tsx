import { d } from "@alloy-js/core/testing";
import { expect, it } from "vitest";
import { ClassDeclaration, PythonModule } from "../../../src/python/index.js";
import { Model } from "@typespec/compiler";
import { getEmitOutput } from "../utils.js";

async function getOutput(code: string, name: string): Promise<string | undefined> {
  const output = await getEmitOutput(code, (program) => {
    const testClass = program.resolveTypeReference(name)[0]! as Model;
    return (
      <PythonModule name="test.py">
        <ClassDeclaration type={testClass} />
      </PythonModule>
    )
  });
  if (typeof output === "string") {
    return output.trim();
  }
  return undefined;
}

it.only("empty class", async () => {
  const code = `
    model TestClass {}
  `;
  const output = await getOutput(code, "TestClass");
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
  const output = await getOutput(code, "TestClass");
  expect(output).toBe(d`
    class TestClass(Foo):
      pass
  `);
});

it("with class variables", async () => {
  const code = `
    model TestClass {
      special: string;
    }
  `;
  const output = await getOutput(code, "TestClass");
  expect(output).toBe(d`
    class TestClass:
      special: str
  `);
});

it("with instance variables", async () => {
  const code = `
    model TestClass {
      fooVar: string;
      barVar: int16;
    }
  `;
  const output = await getOutput(code, "TestClass");
  expect(output).toBe(d`
    class TestClass:
      def __init__(self, foo_var: str, bar_var: int):
        self.foo_var = foo_var
        self.bar_var = bar_var
  `);
});
