import { d } from "@alloy-js/core/testing";
import { expect, it } from "vitest";
import { ClassDeclaration } from "../../../src/python/index.js";
import { Model } from "@typespec/compiler";
import { getEmitOutput } from "../utils.js";

async function getOutput(code: string, name: string): Promise<string | undefined> {
  const output = await getEmitOutput(code, (program) => {
    const children = [];
    
    const Test = program.resolveTypeReference(name)[0]! as Model;
    return <ClassDeclaration type={Test} />
  });
  if (typeof output === "string") {
    return output.trim();
  }
  return undefined;
}

it.only("with references", async() => {
  const code = `
    model Foo {
      name: string;
    }

    namespace Bar {
      model Bar {
        foo: Foo;
      }
    }
  `;
  const output = await getOutput(code, "Bar");
  expect(output).toBe(d`
    from .foo import Foo

    class Bar:
      def __init__(self, foo: Foo):
        self.foo = foo
  `);
});
