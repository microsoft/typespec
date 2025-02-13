import { d } from "@alloy-js/core/testing";
import { Enum, Model, Union } from "@typespec/compiler";
import { describe, expect, it } from "vitest";
import { EnumDeclaration } from "../../../src/typescript/components/enum-declaration.js";
import { InterfaceDeclaration, UnionDeclaration } from "../../../src/typescript/index.js";
import { getEmitOutput } from "../../utils.js";

describe("Typescript Enum Member Expression", () => {
  it("Reference to a named enum member", async () => {
    const code = `
      enum Foo {
        one: 1,
        two: 2,
        three: 3
      }

      model Bar {
         one: Foo.one;
      }
    `;
    const output = await getEmitOutput(code, (program) => {
      const Bar = program.resolveTypeReference("Bar")[0]! as Model;
      return <>
        <EnumDeclaration type={program.resolveTypeReference("Foo")[0]! as Enum} />
        <InterfaceDeclaration type={Bar} />
      </>;
    });

    expect(output).toBe(d`
      enum Foo {
        one = 1,
        two = 2,
        three = 3
      }
      interface Bar {
        "one": Foo.one;
      }
    `);
  });

  it("Reference to an unamed enum member", async () => {
    const code = `
      enum Foo {
        one,
        two,
        three
      }

      model Bar {
         one: Foo.one;
      }
    `;
    const output = await getEmitOutput(code, (program) => {
      const Bar = program.resolveTypeReference("Bar")[0]! as Model;
      return <>
        <EnumDeclaration type={program.resolveTypeReference("Foo")[0]! as Enum} />
        <InterfaceDeclaration type={Bar} />
      </>;
    });

    expect(output).toBe(d`
      enum Foo {
        one = "one",
        two = "two",
        three = "three"
      }
      interface Bar {
        "one": Foo.one;
      }
    `);
  });
});

describe("Typescript Union Member Expression", () => {
  it("Reference to a named enum member", async () => {
    const code = `
      union Foo {
        one: 1,
        two: 2,
        three: 3
      }

      model Bar {
         one: Foo.one;
      }
    `;
    const output = await getEmitOutput(code, (program) => {
      const Bar = program.resolveTypeReference("Bar")[0]! as Model;
      return <>
        <UnionDeclaration type={program.resolveTypeReference("Foo")[0]! as Union} />
        <InterfaceDeclaration type={Bar} />
      </>;
    });

    expect(output).toBe(d`
      type Foo = 1 | 2 | 3;
      interface Bar {
        "one": 1;
      }
    `);
  });

  it("Reference to a union variant with unamed siblings", async () => {
    const code = `
      union Foo {
        one: "one",
        "two",
        "three"
      }

      model Bar {
         one: Foo.one;
      }
    `;
    const output = await getEmitOutput(code, (program) => {
      const Bar = program.resolveTypeReference("Bar")[0]! as Model;
      return <>
        <UnionDeclaration type={program.resolveTypeReference("Foo")[0]! as Union} />
        <InterfaceDeclaration type={Bar} />
      </>;
    });

    expect(output).toBe(d`
      type Foo = "one" | "two" | "three";
      interface Bar {
        "one": "one";
      }
    `);
  });
});
