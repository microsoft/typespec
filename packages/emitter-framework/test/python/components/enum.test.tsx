import { d } from "@alloy-js/core/testing";
import { expect, it } from "vitest";
import { ClassDeclaration, PythonModule, PythonPackage } from "../../../src/python/index.js";
import { getEmitOutput } from "../utils.js";
import { Enum } from "@typespec/compiler";

async function getOutput(code: string, name: string): Promise<string | undefined> {
  const output = await getEmitOutput(code, (program) => {
    const testEnum = program.resolveTypeReference(name)[0]! as Enum;
    return (
      <PythonPackage name="test_package">
        <PythonModule name="test">
          <ClassDeclaration type={testEnum} />
        </PythonModule>
      </PythonPackage>
    )
  });
  if (typeof output === "string") {
    return output.trim();
  }
  return undefined;
}

it("empty enum", async () => {
  const code = `
    enum TestEnum {}
  `;
  const output = await getOutput(code, "TestEnum");
  expect(output).toBe(d`
    class TestEnum(Enum):
      pass
  `);
});

it("with values", async () => {
  const code = `
    enum TestEnum {
      Foo,
      Bar,
      FooBar
    }
  `;
  const output = await getOutput(code, "TestEnum");
  expect(output).toBe(d`
    class TestEnum(Enum):
      FOO = "Foo"
      BAR = "Bar"
      FOO_BAR = "FooBar"
  `);
});

it("with raw values", async () => {
  const code = `
    enum TestEnum {
      Foo: "foo",
      Bar: "bar",
      FooBar: "foobar"
    }
  `;
  const output = await getOutput(code, "TestEnum");
  expect(output).toBe(d`
    class TestEnum(Enum):
      FOO = "foo"
      BAR = "bar"
      FOO_BAR = "foobar"
  `);
});

it("with spread", async () => {
  const code = `
    enum Quadrilaterals {
      Square,
      Rectangle,
      Rhombus
    }

    enum Shapes {
      ...Quadrilaterals,
      Circle,
      Triangle
    }
  `;
  const output = await getOutput(code, "Shapes");
  expect(output).toBe(d`
    class Shapes(Enum):
      SQUARE = "Square"
      RECTANGLE = "Rectangle"
      RHOMBUS = "Rhombus"
      CIRCLE = "Circle"
      TRIANGLE = "Triangle"
  `);
});

