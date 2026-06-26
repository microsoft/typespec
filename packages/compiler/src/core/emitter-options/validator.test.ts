import { describe, expect, it } from "vitest";
import { Tester } from "../../../test/tester.js";
import { $ } from "../../typekit/index.js";
import { compilerAssert } from "../diagnostics.js";
import { validateEmitterOptions, ValidationError } from "./validator.js";

async function validateOptions(code: string, value: unknown): Promise<readonly ValidationError[]> {
  const { program } = await Tester.compile(code);

  const type = $(program).type.resolve("EmitterOptions");
  compilerAssert(type, "EmitterOptions type not found");
  return validateEmitterOptions(program, value, type);
}

describe("scalars", () => {
  it("pass", async () => {
    const errors = await validateOptions(
      `
      model EmitterOptions {
        prop: string;  
      }`,
      { prop: "hello" },
    );
    expect(errors).toEqual([]);
  });

  describe("non supported scalars", () => {
    it.each([
      ["int64", 1],
      ["uint64", 1],
      ["integer", 1],
      ["float", 1],
      ["decimal", 1],
    ])("%s", async (typeStr, value) => {
      const errors = await validateOptions(
        `
        model EmitterOptions {
          prop: ${typeStr};  
        }`,
        { prop: value },
      );
      expect(errors).toEqual([
        {
          code: "unsupported",
          message: `${typeStr} is not supported for emitter options.`,
          target: ["prop"],
        },
      ]);
    });
  });
});

describe("@pattern", () => {
  it("validate @pattern defined on property", async () => {
    const errors = await validateOptions(
      `
      model EmitterOptions {
        @pattern("^hello$")
        prop: string;  
      }`,
      { prop: "hellobar" },
    );
    expect(errors).toEqual([
      {
        code: "invalid-pattern",
        message: "hellobar does not match pattern /^hello$/",
        target: ["prop"],
      },
    ]);
  });
});

describe("arrays", () => {
  it("pass", async () => {
    const errors = await validateOptions(
      `
      model EmitterOptions {
        prop: string[];  
      }`,
      { prop: ["hello", "world"] },
    );
    expect(errors).toEqual([]);
  });

  it("error if passing non array", async () => {
    const errors = await validateOptions(
      `
      model EmitterOptions {
        prop: string[];  
      }`,
      { prop: "hello" },
    );
    expect(errors).toEqual([
      {
        code: "type-mismatch",
        message: "Expected type array",
        target: ["prop"],
      },
    ]);
  });
});

describe("optional/required properties", () => {
  it("missing optional property passes", async () => {
    const errors = await validateOptions(
      `
      model EmitterOptions {
        prop?: string;  
      }`,
      {},
    );
    expect(errors).toEqual([]);
  });

  it("missing required property errors", async () => {
    const errors = await validateOptions(
      `
      model EmitterOptions {
        prop: string;  
      }`,
      {},
    );
    expect(errors).toEqual([
      {
        code: "missing-property",
        message: `Missing required property "prop"`,
        target: ["prop"],
      },
    ]);
  });
});

describe("unknown properties", () => {
  it("errors on unknown property", async () => {
    const errors = await validateOptions(
      `
      model EmitterOptions {
        prop?: string;  
      }`,
      { other: "hello" },
    );
    expect(errors).toEqual([
      {
        code: "unknown-property",
        message: `Unknown property "other"`,
        target: ["other"],
      },
    ]);
  });
});

describe("unions", () => {
  it("passes when value matches a string literal variant", async () => {
    const errors = await validateOptions(
      `
      model EmitterOptions {
        prop?: "yaml" | "json";  
      }`,
      { prop: "json" },
    );
    expect(errors).toEqual([]);
  });

  it("errors with allowed values when no literal variant matches", async () => {
    const errors = await validateOptions(
      `
      model EmitterOptions {
        prop?: "yaml" | "json";  
      }`,
      { prop: "xml" },
    );
    expect(errors).toEqual([
      {
        code: "invalid-value",
        message: `Value "xml" is not one of the allowed values: "yaml", "json"`,
        target: ["prop"],
      },
    ]);
  });

  it("passes when value matches a model variant", async () => {
    const errors = await validateOptions(
      `
      model EmitterOptions {
        prop?: "a" | { kind: "a" | "b", separator?: string };  
      }`,
      { prop: { kind: "b", separator: "/" } },
    );
    expect(errors).toEqual([]);
  });
});

describe("enums", () => {
  it("passes when value matches an enum member", async () => {
    const errors = await validateOptions(
      `
      enum Color { Red: "red", Blue: "blue" }
      model EmitterOptions {
        prop?: Color;  
      }`,
      { prop: "red" },
    );
    expect(errors).toEqual([]);
  });

  it("errors when value is not an enum member", async () => {
    const errors = await validateOptions(
      `
      enum Color { Red: "red", Blue: "blue" }
      model EmitterOptions {
        prop?: Color;  
      }`,
      { prop: "green" },
    );
    expect(errors).toEqual([
      {
        code: "invalid-value",
        message: `Value "green" is not one of the allowed values: "red", "blue"`,
        target: ["prop"],
      },
    ]);
  });
});

describe("custom scalars", () => {
  it("validates a custom scalar against its built-in base", async () => {
    const errors = await validateOptions(
      `
      scalar myPath extends string;
      model EmitterOptions {
        prop?: myPath;  
      }`,
      { prop: 123 },
    );
    expect(errors).toEqual([
      {
        code: "type-mismatch",
        message: "Expected type string",
        target: ["prop"],
      },
    ]);
  });
});

describe("Record", () => {
  it("validates every entry against the value type", async () => {
    const errors = await validateOptions(
      `
      model EmitterOptions {
        prop?: Record<string>;  
      }`,
      { prop: { a: "x", b: 1 } },
    );
    expect(errors).toEqual([
      {
        code: "type-mismatch",
        message: "Expected type string",
        target: ["prop", "b"],
      },
    ]);
  });
});
