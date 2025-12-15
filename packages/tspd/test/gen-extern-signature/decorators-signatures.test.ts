import { definePackageFlags } from "@typespec/compiler";
import {
  createTestHost,
  expectDiagnosticEmpty,
  resolveVirtualPath,
} from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import {
  generateExternDecorators,
  generateExternSignatures,
} from "../../src/gen-extern-signatures/gen-extern-signatures.js";

async function generateDecoratorSignatures(code: string) {
  const host = await createTestHost();
  host.addTypeSpecFile(
    "main.tsp",
    `
    import "./lib.js";
    using TypeSpec.Reflection;
    ${code}`,
  );
  host.addJsFile("lib.js", {
    $flags: definePackageFlags({}),
  });
  await host.diagnose("main.tsp", {
    parseOptions: { comments: true, docs: true },
  });

  expectDiagnosticEmpty(
    host.program.diagnostics.filter((x) => x.code !== "missing-implementation"),
  );

  const result = await generateExternDecorators(host.program, "test-lib", new Map(), {
    prettierConfig: {
      printWidth: 160, // So there is no inconsistency in the .each test with different parameter length
      plugins: [],
    },
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

  it("union of union types", async () => {
    await expectSignatures({
      code: `extern dec simple(target: (int32 | string) | Model);`,
      expected: `
${importLine(["Model", "Scalar"])}

export type SimpleDecorator = (context: DecoratorContext, target: Scalar | Model) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
  `,
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
      [`valueof Record<int32>`, `Record<string, number>`],
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

    it("valueof {...Record<int32>, other: string}", async () => {
      await expectSignatures({
        code: `extern dec simple(target, arg1: valueof {...Record<int32>, other: string});`,
        expected: `
${importLine(["Type"])}

export type SimpleDecorator = (
  context: DecoratorContext,
  target: Type,
  arg1: {
    readonly [key: string]: number;
    readonly other: string;
  },
) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
    `,
      });
    });

    it("valueof {name: string, age?: int32}", async () => {
      await expectSignatures({
        code: `extern dec simple(target, arg1: valueof {name: string, age?: int32});`,
        expected: `
${importLine(["Type"])}

export type SimpleDecorator = (
  context: DecoratorContext,
  target: Type,
  arg1: {
    readonly name: string;
    readonly age?: number;
  },
) => void;

export type Decorators = {
  simple: SimpleDecorator;
};
    `,
      });
    });

    it("valueof int32 | string | utcDateTime", async () => {
      await expectSignatures({
        code: `extern dec simple(target, arg1: valueof int32 | string | utcDateTime);`,
        expected: `
${importLine(["ScalarValue", "Type"])}

export type SimpleDecorator = (context: DecoratorContext, target: Type, arg1: number | string | ScalarValue) => void;

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

describe("multiple exports with decorators", () => {
  it("should place decorators in correct export locations", async () => {
    const host = await createTestHost();

    host.add(
      "package.json",
      JSON.stringify({
        name: "test-lib",
        exports: {
          ".": {
            typespec: "./main.tsp",
          },
          "./experimental": {
            typespec: "./experimental.tsp",
          },
        },
      }),
    );

    host.add(
      "main.tsp",
      `
      using TypeSpec.Reflection;

      namespace Azure.Core {
        /** Core decorator from main export */
        extern dec coreDecorator(target: Model);
      }
      `,
    );

    host.add(
      "experimental.tsp",
      `
      using TypeSpec.Reflection;

      namespace Azure.Core.Experimental {
        /** Experimental decorator */
        extern dec experimentalDecorator(target: Operation);

        /** Another experimental decorator */
        extern dec betaFeature(target: Model, enabled: valueof boolean);
      }
      `,
    );

    // Generate signatures using the full generateExternSignatures flow
    const rootDir = resolveVirtualPath(".");
    const diagnostics = await generateExternSignatures(host.compilerHost, rootDir);

    expectDiagnosticEmpty(diagnostics);

    // Read generated files
    const coreFile = await host.compilerHost.readFile(`${rootDir}/generated-defs/Azure.Core.ts`);
    const expFile = await host.compilerHost.readFile(
      `${rootDir}/generated-defs/Azure.Core.Experimental.ts`,
    );

    // Verify main export only has coreDecorator
    expect(coreFile.text).toContain("CoreDecoratorDecorator");
    expect(coreFile.text).toContain("Core decorator from main export");
    expect(coreFile.text).not.toContain("experimentalDecorator");
    expect(coreFile.text).not.toContain("betaFeature");

    // Verify experimental export has experimental decorators
    expect(expFile.text).toContain("ExperimentalDecoratorDecorator");
    expect(expFile.text).toContain("BetaFeatureDecorator");
    expect(expFile.text).toContain("Experimental decorator");
    expect(expFile.text).toContain("enabled: boolean");
  });

  it("should handle secondary export importing from main export", async () => {
    const host = await createTestHost();

    host.add(
      "package.json",
      JSON.stringify({
        name: "test-lib",
        exports: {
          ".": {
            typespec: "./main.tsp",
          },
          "./testing": {
            typespec: "./testing.tsp",
          },
        },
      }),
    );

    // Main export
    host.add(
      "main.tsp",
      `
      using TypeSpec.Reflection;

      namespace MyLib {
        extern dec shared(target: Model);
      }
      `,
    );

    // Secondary export that imports main
    host.add(
      "testing.tsp",
      `
      import "./main.tsp";
      using TypeSpec.Reflection;

      namespace MyLib.Testing {
        /** Testing decorator */
        extern dec testHelper(target: Operation);
      }
      `,
    );

    const rootDir = resolveVirtualPath(".");
    const diagnostics = await generateExternSignatures(host.compilerHost, rootDir);

    expectDiagnosticEmpty(diagnostics);

    // Read generated files
    const mainFile = await host.compilerHost.readFile(`${rootDir}/generated-defs/MyLib.ts`);
    const testingFile = await host.compilerHost.readFile(
      `${rootDir}/generated-defs/MyLib.Testing.ts`,
    );

    // Main export should have shared decorator
    expect(mainFile.text).toContain("SharedDecorator");

    // Testing export should only have testHelper, not shared
    // (shared is from main export and should not be duplicated)
    expect(testingFile.text).toContain("TestHelperDecorator");
    expect(testingFile.text).toContain("Testing decorator");
    expect(testingFile.text).not.toContain("SharedDecorator");
  });

  it("should handle decorator with same name in different exports", async () => {
    const host = await createTestHost();

    host.add(
      "package.json",
      JSON.stringify({
        name: "test-lib",
        exports: {
          ".": {
            typespec: "./main.tsp",
          },
          "./experimental": {
            typespec: "./experimental.tsp",
          },
        },
      }),
    );

    // Main export
    host.add(
      "main.tsp",
      `
      using TypeSpec.Reflection;

      namespace Main {
        /** Main version of decorator */
        extern dec feature(target: Model, version: valueof string);
      }
      `,
    );

    // Experimental export
    host.add(
      "experimental.tsp",
      `
      using TypeSpec.Reflection;

      namespace Experimental {
        /** Experimental version of decorator */
        extern dec feature(target: Model, enabled: valueof boolean);
      }
      `,
    );

    const rootDir = resolveVirtualPath(".");
    const diagnostics = await generateExternSignatures(host.compilerHost, rootDir);

    expectDiagnosticEmpty(diagnostics);

    // Read generated files
    const mainFile = await host.compilerHost.readFile(`${rootDir}/generated-defs/Main.ts`);
    const expFile = await host.compilerHost.readFile(`${rootDir}/generated-defs/Experimental.ts`);

    // Both should have FeatureDecorator but with different signatures
    expect(mainFile.text).toContain("FeatureDecorator");
    expect(mainFile.text).toContain("version: string");
    expect(mainFile.text).toContain("Main version of decorator");

    expect(expFile.text).toContain("FeatureDecorator");
    expect(expFile.text).toContain("enabled: boolean");
    expect(expFile.text).toContain("Experimental version of decorator");
  });

  it("should handle same namespace across multiple exports", async () => {
    const host = await createTestHost();

    host.add(
      "package.json",
      JSON.stringify({
        name: "test-lib",
        exports: {
          ".": {
            typespec: "./main.tsp",
          },
          "./extra": {
            typespec: "./extra.tsp",
          },
        },
      }),
    );

    // Main export with Azure.Core namespace
    host.add(
      "main.tsp",
      `
      using TypeSpec.Reflection;

      namespace Azure.Core {
        /** Main decorator in Azure.Core */
        extern dec mainDecorator(target: Model);
      }
      `,
    );

    // Extra export also uses Azure.Core namespace
    host.add(
      "extra.tsp",
      `
      using TypeSpec.Reflection;

      namespace Azure.Core {
        /** Extra decorator in same namespace */
        extern dec extraDecorator(target: Operation);
      }
      `,
    );

    const rootDir = resolveVirtualPath(".");
    const diagnostics = await generateExternSignatures(host.compilerHost, rootDir);

    expectDiagnosticEmpty(diagnostics);

    // Read generated file - should be a single Azure.Core.ts
    const coreFile = await host.compilerHost.readFile(`${rootDir}/generated-defs/Azure.Core.ts`);

    // Both decorators should be in the same file since they share the namespace
    // but they should have different export locations
    expect(coreFile.text).toContain("MainDecoratorDecorator");
    expect(coreFile.text).toContain("Main decorator in Azure.Core");
    expect(coreFile.text).toContain("ExtraDecoratorDecorator");
    expect(coreFile.text).toContain("Extra decorator in same namespace");

    // Verify the decorators are in the Decorators type
    expect(coreFile.text).toContain("mainDecorator:");
    expect(coreFile.text).toContain("extraDecorator:");
  });
});

function importLine(imports: string[]) {
  const all = new Set(["DecoratorContext", ...imports]);
  return `import type { ${[...all].sort().join(", ")} } from "@typespec/compiler";`;
}
