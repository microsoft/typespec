import { List, StatementList } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { Enum, Union } from "@typespec/compiler";
import { describe, expect, it } from "vitest";
import { TspContext } from "../../../src/core/index.js";
import { EnumDeclaration } from "../../../src/typescript/components/enum-declaration.js";
import { efRefkey } from "../../../src/typescript/utils/refkey.js";
import { getEmitOutput } from "../../utils.js";

describe("Typescript Enum Declaration", () => {
  it("takes an enum type parameter", async () => {
    const code = `
      enum Foo {
        one: 1,
        two: 2,
        three: 3
      }
    `;
    const output = await getEmitOutput(code, (program) => {
      const Foo = program.resolveTypeReference("Foo")[0]! as Enum;
      return (
        <TspContext.Provider value={{ program }}>
          <EnumDeclaration type={Foo} />
        </TspContext.Provider>
      );
    });

    expect(output).toBe(d`
      enum Foo {
        one = 1,
        two = 2,
        three = 3
      }
    `);
  });

  it("takes a union type parameter", async () => {
    const code = `
      union Foo {
        one: 1,
        two: 2,
        three: 3
      }
    `;
    const output = await getEmitOutput(code, (program) => {
      const Foo = program.resolveTypeReference("Foo")[0]! as Union;
      return (
        <TspContext.Provider value={{ program }}>
          <EnumDeclaration type={Foo} />
        </TspContext.Provider>
      );
    });

    expect(output).toBe(d`
      enum Foo {
        one = 1,
        two = 2,
        three = 3
      }
    `);
  });

  it("can be referenced", async () => {
    const code = `
      enum Foo {
        one: 1,
        two: 2,
        three: 3
      }
    `;

    const output = await getEmitOutput(code, (program) => {
      const Foo = program.resolveTypeReference("Foo")[0]! as Enum;
      return (
        <TspContext.Provider value={{ program }}>
          <List hardline>
            <EnumDeclaration type={Foo} />
            <StatementList>
              {efRefkey(Foo)}
              {efRefkey(Foo.members.get("one"))}
            </StatementList>
          </List>
        </TspContext.Provider>
      );
    });

    expect(output).toBe(d`
      enum Foo {
        one = 1,
        two = 2,
        three = 3
      }
      Foo;
      Foo.one;
    `);
  });

  it("can be referenced using union", async () => {
    const code = `
      union Foo {
        one: 1,
        two: 2,
        three: 3
      }
    `;

    const output = await getEmitOutput(code, (program) => {
      const Foo = program.resolveTypeReference("Foo")[0]! as Union;
      return (
        <TspContext.Provider value={{ program }}>
          <List hardline>
            <EnumDeclaration type={Foo} />
            <StatementList>
              {efRefkey(Foo)}
              {efRefkey(Foo.variants.get("one"))}
            </StatementList>
          </List>
        </TspContext.Provider>
      );
    });

    expect(output).toBe(d`
      enum Foo {
        one = 1,
        two = 2,
        three = 3
      }
      Foo;
      Foo.one;
    `);
  });
});
