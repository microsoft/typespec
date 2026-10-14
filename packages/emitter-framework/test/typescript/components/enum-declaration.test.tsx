import { List, StatementList } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import type { Enum, Model, Union } from "@typespec/compiler";
import { expect, it } from "vitest";
import { TspContext } from "../../../src/core/index.js";
import { EnumDeclaration } from "../../../src/typescript/components/enum-declaration.js";
import { TypeTransformDeclaration } from "../../../src/typescript/components/type-transform.js";
import { TypeDeclaration } from "../../../src/typescript/index.js";
import { efRefkey } from "../../../src/typescript/utils/refkey.js";
import { getEmitOutput } from "../../utils.js";

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

it("adds JSDoc from TypeSpec", async () => {
  const code = `
    /**
     * This is a test enum
     */
    enum Foo {
      @doc("This is one")
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
    /**
     * This is a test enum
     */
    enum Foo {
      /**
       * This is one
       */
      one = 1,
      two = 2,
      three = 3
    }
  `);
});

it("explicit doc take precedence", async () => {
  const code = `
    /**
     * This is a test enum
     */
    enum Foo {
      @doc("This is one")
      one: 1,
      two: 2,
      three: 3
    }
  `;
  const output = await getEmitOutput(code, (program) => {
    const Foo = program.resolveTypeReference("Foo")[0]! as Enum;
    return (
      <TspContext.Provider value={{ program }}>
        <EnumDeclaration type={Foo} doc={["This is an explicit doc"]} />
      </TspContext.Provider>
    );
  });

  expect(output).toBe(d`
    /**
     * This is an explicit doc
     */
    enum Foo {
      /**
       * This is one
       */
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

it("uses the json encoded name as the member value", async () => {
  const code = `
    enum Foo {
      @encodedName("application/json", "on")
      active,
      @encodedName("application/json", "off")
      inactive: "inactive-value",
      pending,
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
      active = "on",
      inactive = "off",
      pending = "pending"
    }
  `);
});

it("uses the same json encoded name for enum values and discriminator checks", async () => {
  const output = await getEmitOutput(
    `
      enum PetKind {
        @encodedName("application/json", "feline")
        cat,
      }

      @discriminator("kind")
      model Pet {
        kind: PetKind;
      }

      model Cat extends Pet {
        kind: PetKind.cat;
      }
    `,
    (program) => {
      const PetKind = program.resolveTypeReference("PetKind")[0]! as Enum;
      const Pet = program.resolveTypeReference("Pet")[0]! as Model;
      const Cat = program.resolveTypeReference("Cat")[0]! as Model;
      return (
        <TspContext.Provider value={{ program }}>
          <List hardline>
            <EnumDeclaration type={PetKind} />
            <TypeDeclaration type={Pet} />
            <TypeDeclaration type={Cat} />
            <TypeTransformDeclaration type={Pet} target="transport" />
            <TypeTransformDeclaration type={Cat} target="transport" />
          </List>
        </TspContext.Provider>
      );
    },
  );

  expect(output).toContain(`cat = "feline"`);
  expect(output).toContain(`item.kind === "feline"`);
});
