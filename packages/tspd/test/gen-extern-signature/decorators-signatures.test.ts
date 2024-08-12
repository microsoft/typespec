import { definePackageFlags } from "@typespec/compiler";
import { createTestHost, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { generateExternDecorators } from "../../src/gen-extern-signatures/gen-extern-signatures.js";

async function generateDecoratorSignatures(code: string) {
  const host = await createTestHost();
  host.addTypeSpecFile(
    "main.tsp",
    `
    import "./lib.js";
    using TypeSpec.Reflection;
    ${code}`
  );
  host.addJsFile("lib.js", {
    $flags: definePackageFlags({
      decoratorArgMarshalling: "new",
    }),
  });
  await host.diagnose("main.tsp", {
    parseOptions: { comments: true, docs: true },
  });

  expectDiagnosticEmpty(
    host.program.diagnostics.filter((x) => x.code !== "missing-implementation")
  );

  const result = await generateExternDecorators(host.program, "test-lib", {
    printWidth: 160, // So there is no inconsistency in the .each test with different parameter length
    plugins: [],
  });

  return result["__global__.ts"];
}

async function expectSignatures({ code, expected }: { code: string; expected: string }) {
  const result = await generateDecoratorSignatures(code);
  expect(result.trim()).toEqual(expected.trim());
}

it("generate simple decorator with no parameters", async () => {
  await expectSignatures({
    code: `extern dec simple(target);`,
    expected: `
${importLine(["Type"])}

export type SimpleDecorator = (context: DecoratorContext, target: Type) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
  `,
  });
});

describe("generate target type", () => {
  describe("single reflection type", () => {
    it.each([
      ["unknown", "Type"],
      ["Model", "Model"],
      ["ModelProperty", "ModelProperty"],
      ["Operation", "Operation"],
      ["Interface", "Interface"],
      ["Enum", "Enum"],
      ["EnumMember", "EnumMember"],
      ["Union", "Union"],
      ["UnionVariant", "UnionVariant"],
      ["Scalar", "Scalar"],
    ])("%s => %s", async (ref, expected) => {
      await expectSignatures({
        code: `extern dec simple(target: ${ref});`,
        expected: `
${importLine([expected])}

export type SimpleDecorator = (context: DecoratorContext, target: ${expected}) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
    `,
      });
    });
  });

  describe("union of reflection types", () => {
    it.each([
      ["Model | Operation", ["Model", "Operation"]],
      ["ModelProperty | Scalar", ["ModelProperty", "Scalar"]],
    ])("%s => %s", async (ref, expected) => {
      await expectSignatures({
        code: `extern dec simple(target: ${ref});`,
        expected: `
${importLine([...expected])}

export type SimpleDecorator = (context: DecoratorContext, target: ${expected.join(" | ")}) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
    `,
      });
    });
  });

  describe("actual types", () => {
    it.each([
      ["model Options { name: string, other: string }", "Options", "Type"],
      ["enum Direction { up, down }", "Direction", "Type"],
      ["", "string", "Scalar"], // When referencing a scalar type as the target it can then only be a scalar (in a parameter it could also be a a literal matching the scalar, or a union of scalars/literals)
    ])("%s", async (code, ref, expected) => {
      await expectSignatures({
        code: `extern dec simple(target: ${ref});\n${code}`,
        expected: `
${importLine([expected])}

export type SimpleDecorator = (context: DecoratorContext, target: ${expected}) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
    `,
      });
    });
  });
});

describe("generate parameter type", () => {
  describe("single reflection type", () => {
    it.each([
      ["unknown", "Type"],
      ["Model", "Model"],
      ["ModelProperty", "ModelProperty"],
      ["Operation", "Operation"],
      ["Interface", "Interface"],
      ["Enum", "Enum"],
      ["EnumMember", "EnumMember"],
      ["Union", "Union"],
      ["UnionVariant", "UnionVariant"],
      ["Scalar", "Scalar"],
    ])("%s => %s", async (ref, expected) => {
      await expectSignatures({
        code: `extern dec simple(target, arg1: ${ref});`,
        expected: `
${importLine(["Type", expected])}

export type SimpleDecorator = (context: DecoratorContext, target: Type, arg1: ${expected}) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
    `,
      });
    });
  });

  describe("union of reflection types", () => {
    it.each([
      ["Model | Operation", ["Model", "Operation"]],
      ["ModelProperty | Scalar", ["ModelProperty", "Scalar"]],
    ])("%s => %s", async (ref, expected) => {
      await expectSignatures({
        code: `extern dec simple(target, arg1: ${ref});`,
        expected: `
${importLine(["Type", ...expected])}

export type SimpleDecorator = (context: DecoratorContext, target: Type, arg1: ${expected.join(" | ")}) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
    `,
      });
    });
  });

  describe("valueof", () => {
    it.each([
      ["valueof string", "string"],
      ["valueof boolean", "boolean"],
      ["valueof int32", "number"],
      ["valueof int8", "number"],
      ["valueof uint64", "Numeric"],
      ["valueof int64", "Numeric"],
      [`valueof "abc"`, `"abc"`],
      [`valueof 123`, `123`],
      [`valueof true`, `true`],
      [`valueof "abc" | "def"`, `"abc" | "def"`],
      [`valueof "abc" | "def" | string`, `"abc" | "def" | string`],
      [`valueof string[]`, `readonly string[]`],
      [`valueof ("abc" | "def")[]`, `readonly ("abc" | "def")[]`],
      [`valueof {name: string, age?: int32}`, `{ readonly name: string; readonly age?: number }`],
    ])("%s => %s", async (ref, expected) => {
      await expectSignatures({
        code: `extern dec simple(target, arg1: ${ref});`,
        expected: `
${importLine(["Type", ...(expected === "Numeric" ? ["Numeric"] : [])])}

export type SimpleDecorator = (context: DecoratorContext, target: Type, arg1: ${expected}) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
    `,
      });
    });

    it("generate local model as interface", async () => {
      await expectSignatures({
        code: `
          model Info { name: string, age?: int32} 
          extern dec simple(target, arg1: valueof Info);`,
        expected: `
${importLine(["Type"])}

export interface Info {
  readonly name: string;
  readonly age?: number;
}

export type SimpleDecorator = (context: DecoratorContext, target: Type, arg1: Info) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
    `,
      });
    });
  });

  describe("actual types", () => {
    it.each([
      ["model Options { name: string, other: string }", "Options", "Type"],
      ["enum Direction { up, down }", "Direction", "Type"],
    ])("%s", async (code, ref, expected) => {
      await expectSignatures({
        code: `extern dec simple(target, arg1: ${ref});\n${code}`,
        expected: `
${importLine(["Type", expected])}

export type SimpleDecorator = (context: DecoratorContext, target: Type, arg1: ${expected}) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
    `,
      });
    });
  });
});

describe("generate rest parameter type", () => {
  it("include as rest", async () => {
    await expectSignatures({
      code: `
/** Some doc comment */      
extern dec simple(target, ...args: Model[]);`,
      expected: `
${importLine(["Type", "Model"])}

/**
 * Some doc comment
 */
export type SimpleDecorator = (context: DecoratorContext, target: Type, ...args: Model[]) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
  `,
    });
  });

  describe("valueof", () => {
    it.each([
      ["valueof string[]", "string[]"],
      ["valueof boolean[]", "boolean[]"],
      ["valueof int32[]", "number[]"],
      ["valueof int8[]", "number[]"],
      ["valueof uint64[]", "Numeric[]"],
      ["valueof int64[]", "Numeric[]"],
      [`valueof "abc"[]`, `"abc"[]`],
      [`valueof 123[]`, `123[]`],
      [`valueof true[]`, `true[]`],
      [`valueof ("abc" | "def")[]`, `("abc" | "def")[]`],
      [`valueof ("abc" | "def" | string)[]`, `("abc" | "def" | string)[]`],
    ])("%s => %s", async (ref, expected) => {
      await expectSignatures({
        code: `extern dec simple(target, ...args: ${ref});`,
        expected: `
${importLine(["Type", ...(expected === "Numeric[]" ? ["Numeric"] : [])])}

export type SimpleDecorator = (context: DecoratorContext, target: Type, ...args: ${expected}) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
    `,
      });
    });
  });
});

describe("decorator comments", () => {
  it("include basic doc comment", async () => {
    await expectSignatures({
      code: `
/** Some doc comment */      
extern dec simple(target);`,
      expected: `
${importLine(["Type"])}

/**
 * Some doc comment
 */
export type SimpleDecorator = (context: DecoratorContext, target: Type) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
  `,
    });
  });

  it("include @param doc comment", async () => {
    await expectSignatures({
      code: `
/** 
 * Some doc comment 
 * 
 * @param arg1 This is the first argument
 * @param arg2 This is the second argument
 */      
extern dec simple(target, arg1, arg2);`,
      expected: `
${importLine(["Type"])}

/**
 * Some doc comment
 *
 * @param arg1 This is the first argument
 * @param arg2 This is the second argument
 */
export type SimpleDecorator = (context: DecoratorContext, target: Type, arg1: Type, arg2: Type) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
  `,
    });
  });
});

function importLine(imports: string[]) {
  const all = new Set(["DecoratorContext", ...imports]);
  return `import type { ${[...all].sort().join(", ")} } from "@typespec/compiler";`;
}
