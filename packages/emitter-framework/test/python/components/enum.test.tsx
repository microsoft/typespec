import { d } from "@alloy-js/core/testing";
import { expect, it } from "vitest";
import { EnumDeclaration, PythonModule, PythonPackage } from "../../../src/python/index.js";
import { getEmitOutput } from "../utils.js";
import { Enum } from "@typespec/compiler";

async function getOutput(code: string, name: string): Promise<string | undefined> {
  const output = await getEmitOutput(code, (program) => {
    const testEnum = program.resolveTypeReference(name)[0]! as Enum;
    return (
      <PythonPackage name="test_package">
        <PythonModule name="test">
          <EnumDeclaration type={testEnum} />
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
      Bar
    }
  `;
  const output = await getOutput(code, "TestEnum");
  expect(output).toBe(d`
    class TestEnum(Enum):
      foo = "FOO"
      bar = "BAR"
  `);
});

it("with raw values", async () => {
  const code = `
    enum TestEnum {
      Foo: "foo",
      Bar: "bar"
    }
  `;
  const output = await getOutput(code, "TestEnum");
  expect(output).toBe(d`
    class TestEnum(Enum):
      foo = "foo"
      bar = "bar"
  `);
});

