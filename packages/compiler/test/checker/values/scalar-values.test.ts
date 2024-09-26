import { strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { expectDiagnostics } from "../../../src/testing/expect.js";
import { compileValue, diagnoseValue } from "./utils.js";

describe("instantiate with named constructor", () => {
  const ipv4Code = `
    scalar ipv4 {
      init fromString(value: string);
      init fromBytes(a: uint8, b: uint8, c: uint8, d: uint8);
    }
  `;

  it("with single arg", async () => {
    const value = await compileValue(`ipv4.fromString("0.0.1.1")`, ipv4Code);
    strictEqual(value.valueKind, "ScalarValue");
    strictEqual(value.type.kind, "Scalar");
    strictEqual(value.type.name, "ipv4");
    strictEqual(value.scalar?.name, "ipv4");
    strictEqual(value.value.name, "fromString");
    expect(value.value.args).toEqual([
      expect.objectContaining({
        value: "0.0.1.1",
        valueKind: "StringValue",
      }),
    ]);
  });

  it("with multiple args", async () => {
    const value = await compileValue(`ipv4.fromBytes(0, 0, 1, 1)`, ipv4Code);
    strictEqual(value.valueKind, "ScalarValue");
    strictEqual(value.type.kind, "Scalar");
    strictEqual(value.type.name, "ipv4");
    strictEqual(value.scalar?.name, "ipv4");
    strictEqual(value.value.name, "fromBytes");
    expect(value.value.args).toEqual([
      expect.objectContaining({
        valueKind: "NumericValue",
      }),
      expect.objectContaining({
        valueKind: "NumericValue",
      }),
      expect.objectContaining({
        valueKind: "NumericValue",
      }),
      expect.objectContaining({
        valueKind: "NumericValue",
      }),
    ]);
  });

  it("instantiate using constructor from parent scalar", async () => {
    const value = await compileValue(
      `b.fromString("a")`,
      `
      scalar a { init fromString(val: string);}
      scalar b extends a { }
    `,
    );
    strictEqual(value.valueKind, "ScalarValue");
    strictEqual(value.type.kind, "Scalar");
    strictEqual(value.type.name, "b");
    strictEqual(value.scalar?.name, "b");
    strictEqual(value.value.name, "fromString");
  });

  it("instantiate from another scalar", async () => {
    const value = await compileValue(
      `b.fromA(a.fromString("a"))`,
      `
      scalar a { init fromString(val: string);}
      scalar b { init fromA(val: a);}
    `,
    );
    strictEqual(value.valueKind, "ScalarValue");
    strictEqual(value.type.kind, "Scalar");
    strictEqual(value.type.name, "b");
    strictEqual(value.scalar?.name, "b");
    strictEqual(value.value.name, "fromA");
    expect(value.value.args).toHaveLength(1);
    const arg = value.value.args[0];
    strictEqual(arg.valueKind, "ScalarValue");
    strictEqual(arg.type.kind, "Scalar");
    strictEqual(arg.type.name, "a");
  });

  it("emit warning if passing wrong type to constructor", async () => {
    const diagnostics = await diagnoseValue(`ipv4.fromString(123)`, ipv4Code);
    expectDiagnostics(diagnostics, {
      code: "invalid-argument",
      message: "Argument of type '123' is not assignable to parameter of type 'string'",
    });
  });

  it("emit warning if passing too many args", async () => {
    const diagnostics = await diagnoseValue(`ipv4.fromString("abc", "def")`, ipv4Code);
    expectDiagnostics(diagnostics, {
      code: "invalid-argument-count",
      message: "Expected 1 arguments, but got 2.",
    });
  });

  it("emit warning if passing too few args", async () => {
    const diagnostics = await diagnoseValue(`ipv4.fromBytes(0, 0, 0)`, ipv4Code);
    expectDiagnostics(diagnostics, {
      code: "invalid-argument-count",
      message: "Expected 4 arguments, but got 3.",
    });
  });

  describe("with optional params", () => {
    it("allow not providing it", async () => {
      const value = await compileValue(
        `ipv4.fromItems("a")`,
        `
          scalar ipv4 {
            init fromItems(a: string, b?: string);
          }
        `,
      );
      strictEqual(value.valueKind, "ScalarValue");
      strictEqual(value.value.name, "fromItems");
      expect(value.value.args).toHaveLength(1);
    });
    it("allow providing it", async () => {
      const value = await compileValue(
        `ipv4.fromItems("a", "b")`,
        `
          scalar ipv4 {
            init fromItems(a: string, b?: string);
          }
        `,
      );
      strictEqual(value.valueKind, "ScalarValue");
      strictEqual(value.value.name, "fromItems");
      expect(value.value.args).toHaveLength(2);
    });

    it("emit warning if passing wrong type to constructor", async () => {
      const diagnostics = await diagnoseValue(
        `ipv4.fromItems("a", 123)`,
        `
          scalar ipv4 {
            init fromItems(...value: string[]);
          }
        `,
      );
      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument of type '123' is not assignable to parameter of type 'string'",
      });
    });
  });
  describe("with rest params", () => {
    it("support rest params", async () => {
      const value = await compileValue(
        `ipv4.fromItems("a", "b", "c")`,
        `
          scalar ipv4 {
            init fromItems(...value: string[]);
          }
        `,
      );
      strictEqual(value.valueKind, "ScalarValue");
      strictEqual(value.value.name, "fromItems");
      expect(value.value.args).toHaveLength(3);
    });

    it("support rest params with positional before", async () => {
      const value = await compileValue(
        `ipv4.fromItems(1, "b", "c")`,
        `
          scalar ipv4 {
            init fromItems(value: int32, ...value: string[]);
          }
        `,
      );
      strictEqual(value.valueKind, "ScalarValue");
      strictEqual(value.value.name, "fromItems");
      expect(value.value.args).toHaveLength(3);
    });

    it("emit warning if passing wrong type to constructor", async () => {
      const diagnostics = await diagnoseValue(
        `ipv4.fromItems(123)`,
        `
          scalar ipv4 {
            init fromItems(...value: string[]);
          }
        `,
      );
      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument of type '123' is not assignable to parameter of type 'string'",
      });
    });
  });
});
