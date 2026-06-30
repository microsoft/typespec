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

  describe("supported numeric scalars", () => {
    it.each([
      ["int64", 1],
      ["uint64", 1],
      ["integer", 1],
      ["float", 1.5],
      ["decimal", 1.5],
      ["numeric", 1],
      ["safeint", 1],
    ])("%s accepts a number", async (typeStr, value) => {
      const errors = await validateOptions(
        `
        model EmitterOptions {
          prop: ${typeStr};  
        }`,
        { prop: value },
      );
      expect(errors).toEqual([]);
    });

    it.each([["int64"], ["integer"], ["float"], ["numeric"]])(
      "%s rejects a non-number",
      async (typeStr) => {
        const errors = await validateOptions(
          `
        model EmitterOptions {
          prop: ${typeStr};  
        }`,
          { prop: "not a number" },
        );
        expect(errors).toEqual([
          {
            code: "type-mismatch",
            message: "Expected type number",
            target: ["prop"],
          },
        ]);
      },
    );
  });
});

describe("absolutePath", () => {
  it("passes for an absolute path", async () => {
    const errors = await validateOptions(
      `
      scalar absolutePath extends string;
      model EmitterOptions {
        prop: absolutePath;  
      }`,
      { prop: "/out/dir" },
    );
    expect(errors).toEqual([]);
  });

  it("errors for a relative path starting with `./`", async () => {
    const errors = await validateOptions(
      `
      scalar absolutePath extends string;
      model EmitterOptions {
        prop: absolutePath;  
      }`,
      { prop: "./out" },
    );
    expect(errors).toEqual([
      {
        code: "config-path-absolute",
        message: `Path "./out" cannot be relative. Use {cwd} or {project-root} to specify what the path should be relative to.`,
        target: ["prop"],
        value: "./out",
      },
    ]);
  });

  it("errors for a bare relative path", async () => {
    const errors = await validateOptions(
      `
      scalar absolutePath extends string;
      model EmitterOptions {
        prop: absolutePath;  
      }`,
      { prop: "out" },
    );
    expect(errors).toEqual([
      {
        code: "config-path-absolute",
        message: `Path "out" cannot be relative. Use {cwd} or {project-root} to specify what the path should be relative to.`,
        target: ["prop"],
        value: "out",
      },
    ]);
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

describe("numeric ranges and integer-ness", () => {
  it("accepts an in-range integer", async () => {
    const errors = await validateOptions(`model EmitterOptions { prop?: int8; }`, { prop: 127 });
    expect(errors).toEqual([]);
  });

  it("rejects an out-of-range value", async () => {
    const errors = await validateOptions(`model EmitterOptions { prop?: int8; }`, { prop: 9999 });
    expect(errors).toEqual([
      {
        code: "invalid-value",
        message: "Value 9999 is not assignable to int8, out of range [-128, 127].",
        target: ["prop"],
      },
    ]);
  });

  it("rejects a non-integer for an integer scalar", async () => {
    const errors = await validateOptions(`model EmitterOptions { prop?: int32; }`, { prop: 1.5 });
    expect(errors).toEqual([
      {
        code: "invalid-value",
        message: "Value 1.5 is not assignable to int32, expected an integer.",
        target: ["prop"],
      },
    ]);
  });

  it("rejects a negative value for an unsigned scalar", async () => {
    const errors = await validateOptions(`model EmitterOptions { prop?: uint8; }`, { prop: -3 });
    expect(errors).toEqual([
      {
        code: "invalid-value",
        message: "Value -3 is not assignable to uint8, out of range [0, 255].",
        target: ["prop"],
      },
    ]);
  });

  it("accepts a fractional value for a float scalar", async () => {
    const errors = await validateOptions(`model EmitterOptions { prop?: float64; }`, { prop: 1.5 });
    expect(errors).toEqual([]);
  });
});

describe("@minValue/@maxValue", () => {
  it("rejects a value below @minValue", async () => {
    const errors = await validateOptions(
      `model EmitterOptions { @minValue(1) @maxValue(10) prop?: int32; }`,
      { prop: 0 },
    );
    expect(errors).toEqual([
      {
        code: "invalid-value",
        message: "Value 0 is less than the minimum allowed value 1.",
        target: ["prop"],
      },
    ]);
  });

  it("rejects a value above @maxValue", async () => {
    const errors = await validateOptions(
      `model EmitterOptions { @minValue(1) @maxValue(10) prop?: int32; }`,
      { prop: 20 },
    );
    expect(errors).toEqual([
      {
        code: "invalid-value",
        message: "Value 20 is greater than the maximum allowed value 10.",
        target: ["prop"],
      },
    ]);
  });

  it("accepts a value within range", async () => {
    const errors = await validateOptions(
      `model EmitterOptions { @minValue(1) @maxValue(10) prop?: int32; }`,
      { prop: 5 },
    );
    expect(errors).toEqual([]);
  });
});

describe("@minLength/@maxLength", () => {
  it("rejects a string that is too short", async () => {
    const errors = await validateOptions(
      `model EmitterOptions { @minLength(2) @maxLength(4) prop?: string; }`,
      { prop: "a" },
    );
    expect(errors).toEqual([
      {
        code: "invalid-value",
        message: `String "a" is too short, expected at least 2 characters.`,
        target: ["prop"],
      },
    ]);
  });

  it("rejects a string that is too long", async () => {
    const errors = await validateOptions(
      `model EmitterOptions { @minLength(2) @maxLength(4) prop?: string; }`,
      { prop: "abcde" },
    );
    expect(errors).toEqual([
      {
        code: "invalid-value",
        message: `String "abcde" is too long, expected at most 4 characters.`,
        target: ["prop"],
      },
    ]);
  });

  it("accepts a string within length bounds", async () => {
    const errors = await validateOptions(
      `model EmitterOptions { @minLength(2) @maxLength(4) prop?: string; }`,
      { prop: "abc" },
    );
    expect(errors).toEqual([]);
  });
});

describe("@pattern on scalars applies in nested positions", () => {
  it("validates array items against a scalar @pattern", async () => {
    const errors = await validateOptions(
      `
      @pattern("^a") scalar prefixed extends string;
      model EmitterOptions { prop?: prefixed[]; }`,
      { prop: ["abc", "xyz"] },
    );
    expect(errors).toEqual([
      {
        code: "invalid-pattern",
        message: "xyz does not match pattern /^a/",
        target: ["prop", "1"],
      },
    ]);
  });

  it("validates Record values against a scalar @pattern", async () => {
    const errors = await validateOptions(
      `
      @pattern("^a") scalar prefixed extends string;
      model EmitterOptions { prop?: Record<prefixed>; }`,
      { prop: { a: "abc", b: "xyz" } },
    );
    expect(errors).toEqual([
      {
        code: "invalid-pattern",
        message: "xyz does not match pattern /^a/",
        target: ["prop", "b"],
      },
    ]);
  });
});

describe("scalar identity (not name)", () => {
  it("does not treat a non-std scalar sharing a built-in name as that built-in", async () => {
    const asString = await validateOptions(
      `
      namespace Foo { scalar int32 extends string; }
      model EmitterOptions { prop?: Foo.int32; }`,
      { prop: "hello" },
    );
    expect(asString).toEqual([]);

    const errors = await validateOptions(
      `
      namespace Foo { scalar int32 extends string; }
      model EmitterOptions { prop?: Foo.int32; }`,
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

describe("union nested error attribution", () => {
  it("surfaces the nested error of the matching model variant", async () => {
    const errors = await validateOptions(
      `
      model EmitterOptions {
        prop?: "explicit-only" | { kind: "a" | "b", separator?: string };
      }`,
      { prop: { kind: "b", seperator: "/" } },
    );
    expect(errors).toEqual([
      {
        code: "unknown-property",
        message: `Unknown property "seperator"`,
        target: ["prop", "seperator"],
      },
    ]);
  });
});
