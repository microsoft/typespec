import { Tester } from "#test/test-host.js";
import { effect, Output, renderAsync } from "@alloy-js/core";
import type { Enum, Model, Union } from "@typespec/compiler";
import { $ as typekit } from "@typespec/compiler/typekit";
import { describe, expect, it } from "vitest";
import { DeclarationProvider } from "./declaration-provider.js";

describe("isDeclaration", () => {
  interface DeclarationTestCase {
    description: string;
    code: string;
    expected: boolean;
  }

  async function assertDeclaration(code: string, expected: boolean) {
    const runner = await Tester.createInstance();
    const { program } = await runner.compile(code);
    const $ = typekit(program);
    const provider = new DeclarationProvider($);

    const type = program.resolveTypeReference("Test")[0]!;
    expect(type, "Type Test should exist").toBeDefined();
    expect(provider.isDeclaration(type)).toBe(expected);
  }

  async function assertDeclarationExpression(expression: string, expected: boolean, setup = "") {
    const code = `${setup}model Test { prop: ${expression}; }`;
    const runner = await Tester.createInstance();
    const { program } = await runner.compile(code);
    const $ = typekit(program);
    const provider = new DeclarationProvider($);

    const test = program.resolveTypeReference("Test")[0] as Model;
    const type = test.properties.get("prop")!.type;
    expect(type, "Property type should exist").toBeDefined();
    expect(provider.isDeclaration(type)).toBe(expected);
  }

  const declarationTestCases: DeclarationTestCase[] = [
    {
      description: "named model",
      code: `model Test { name: string; }`,
      expected: true,
    },
    {
      description: "namespace",
      code: `namespace Test { }`,
      expected: true,
    },
    {
      description: "interface",
      code: `interface Test { getPet(): string; }`,
      expected: true,
    },
    {
      description: "enum",
      code: `enum Test { Red, Green, Blue }`,
      expected: true,
    },
    {
      description: "operation",
      code: `op Test(): string;`,
      expected: true,
    },
    {
      description: "named union",
      code: `union Test { string, int32 }`,
      expected: true,
    },
    {
      description: "scalar",
      code: `scalar Test extends string;`,
      expected: true,
    },
  ];

  declarationTestCases.forEach(({ description, code, expected }) => {
    it(`treats ${description} as declaration`, async () => {
      await assertDeclaration(code, expected);
    });
  });

  interface ExpressionTestCase {
    description: string;
    expression: string;
    expected: boolean;
    setup?: string;
  }

  const expressionTestCases: ExpressionTestCase[] = [
    {
      description: "array",
      expression: "string[]",
      expected: false,
    },
    {
      description: "record",
      expression: "Record<string>",
      expected: false,
    },
    {
      description: "anonymous union",
      expression: '"active" | "inactive"',
      expected: false,
    },
    {
      description: "anonymous model",
      expression: "{ name: string }",
      expected: false,
    },
    {
      description: "template instance",
      expression: "Array<string>",
      expected: false,
    },
    {
      description: "scalar (string)",
      expression: "string",
      expected: false,
    },
    {
      description: "custom template instance",
      expression: "Container<string>",
      expected: true,
      setup: "model Container<T> { item: T; }",
    },
    {
      description: "intrinsic (void)",
      expression: "void",
      expected: false,
    },
    {
      description: "intrinsic (never)",
      expression: "never",
      expected: false,
    },
  ];

  expressionTestCases.forEach(({ description, expression, expected, setup }) => {
    it(`treats ${description} as ${expected ? "declaration" : "non-declaration"}`, async () => {
      await assertDeclarationExpression(expression, expected, setup);
    });
  });

  it("treats a model property as a non-declaration", async () => {
    const runner = await Tester.createInstance();
    const { program } = await runner.compile(`model Test { a: string, b: int32 }`);
    const $ = typekit(program);
    const provider = new DeclarationProvider($);

    const model = program.resolveTypeReference("Test")[0]! as Model;
    const property = model.properties.get("a")!;
    expect(provider.isDeclaration(property)).toBe(false);
  });

  it("treats union variant as non-declaration", async () => {
    const runner = await Tester.createInstance();
    const { program } = await runner.compile(`union Test { a: string, b: int32 }`);
    const $ = typekit(program);
    const provider = new DeclarationProvider($);

    const union = program.resolveTypeReference("Test")[0]! as Union;
    const variant = union.variants.get("a")!;
    expect(provider.isDeclaration(variant)).toBe(false);
  });

  it("treats enum member as non-declaration", async () => {
    const runner = await Tester.createInstance();
    const { program } = await runner.compile(`enum Test { Red, Green, Blue }`);
    const $ = typekit(program);
    const provider = new DeclarationProvider($);

    const enumType = program.resolveTypeReference("Test")[0]! as Enum;
    const member = enumType.members.get("Red")!;
    expect(provider.isDeclaration(member)).toBe(false);
  });
});

describe("getRefkey", () => {
  it("creates a refkey for a declaration type", async () => {
    const runner = await Tester.createInstance();
    const { program } = await runner.compile(`
        model Pet {
          name: string;
        }
      `);
    const $ = typekit(program);
    const provider = new DeclarationProvider($);

    const pet = program.resolveTypeReference("Pet")[0]!;
    const key = provider.getRefkey(pet);

    expect(key).toBeDefined();
  });

  it("returns the same refkey for the same type", async () => {
    const runner = await Tester.createInstance();
    const { program } = await runner.compile(`
        model Pet {
          name: string;
        }
      `);
    const $ = typekit(program);
    const provider = new DeclarationProvider($);

    const pet = program.resolveTypeReference("Pet")[0]!;
    const key1 = provider.getRefkey(pet);
    const key2 = provider.getRefkey(pet);

    expect(key1).toBe(key2);
  });

  it("returns different refkeys for different types", async () => {
    const runner = await Tester.createInstance();
    const { program } = await runner.compile(`
        model Pet {
          name: string;
        }
        model Owner {
          name: string;
        }
      `);
    const $ = typekit(program);
    const provider = new DeclarationProvider($);

    const pet = program.resolveTypeReference("Pet")[0]!;
    const owner = program.resolveTypeReference("Owner")[0]!;
    const petKey = provider.getRefkey(pet);
    const ownerKey = provider.getRefkey(owner);

    expect(petKey).not.toBe(ownerKey);
  });

  it("throws for non-declaration types", async () => {
    const runner = await Tester.createInstance();
    const { program } = await runner.compile(`
        model Pet {
          name: string;
        }
      `);
    const $ = typekit(program);
    const provider = new DeclarationProvider($);

    const pet = program.resolveTypeReference("Pet")[0] as Model;
    const prop = pet.properties.get("name")!;

    expect(() => provider.getRefkey(prop)).toThrow(/Type ModelProperty is not a declaration/);
  });

  it("adds type to declarations map", async () => {
    const runner = await Tester.createInstance();
    const { program } = await runner.compile(`
        model Pet {
          name: string;
        }
      `);
    const $ = typekit(program);
    const provider = new DeclarationProvider($);

    const pet = program.resolveTypeReference("Pet")[0]!;

    // Initially not in the map
    expect(provider.declarations.has(pet)).toBe(false);

    // Get refkey should add it
    const key = provider.getRefkey(pet);

    // Now it should be in the map
    expect(provider.declarations.has(pet)).toBe(true);
    expect(provider.declarations.get(pet)).toBe(key);
  });

  it("declarations map is reactive", async () => {
    const runner = await Tester.createInstance();
    const { program } = await runner.compile(`
        model Pet {
          name: string;
        }
      `);
    const $ = typekit(program);
    const provider = new DeclarationProvider($);

    const pet = program.resolveTypeReference("Pet")[0]!;
    let effectRan = false;
    let capturedKey: any = undefined;

    // Set up an effect that reacts to the declarations map
    effect(() => {
      if (provider.declarations.has(pet)) {
        effectRan = true;
        capturedKey = provider.declarations.get(pet);
      }
    });

    // Initially effect should not have run (map is empty)
    expect(effectRan).toBe(false);

    // Get refkey should trigger the effect
    const key = provider.getRefkey(pet);
    await renderAsync(<Output />); // Allow reactivity to flush

    // Effect should have run and captured the key
    expect(effectRan).toBe(true);
    expect(capturedKey).toBe(key);
  });
});
