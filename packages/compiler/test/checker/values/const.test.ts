import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { NumericValue } from "../../../src/index.js";
import { expectDiagnostics } from "../../../src/testing/expect.js";
import { compileValue, diagnoseUsage } from "./utils.js";

describe("without type it use the most precise type", () => {
  it.each([
    ["1", "Number"],
    [`"abc"`, "String"],
    [`true`, "Boolean"],
    [`#{foo: "abc"}`, "Model"],
    [`#["abc"]`, "Tuple"],
  ])("%s => %s", async (input, kind) => {
    const value = await compileValue("a", `const a = ${input};`);
    strictEqual(value.type.kind, kind);
  });
});

it("when assigning another const a primitive value that didn't figure out the scalar it resolved it then", async () => {
  const value = (await compileValue("b", `const a = 123;const b: int64 = a;`)) as NumericValue;
  strictEqual(value.scalar?.kind, "Scalar");
  strictEqual(value.scalar.name, "int64");
});

it("when assigning another const it change the type", async () => {
  const value = await compileValue("b", `const a: int32 = 123;const b: int64 = a;`);
  strictEqual(value.type.kind, "Scalar");
  strictEqual(value.type.name, "int64");
});

it("declare const in namespace", async () => {
  const value = (await compileValue("Data.a", `namespace Data {const a = 123;}`)) as NumericValue;
  strictEqual(value.value.asNumber(), 123);
});

describe("invalid assignment", () => {
  async function expectInvalidAssignment(code: string) {
    const { diagnostics, pos, end } = await diagnoseUsage(code);
    expectDiagnostics(diagnostics, {
      code: "unassignable",
      pos,
      end,
    });
  }

  describe("emit warning if assigning the wrong type", () => {
    it("null", async () => {
      await expectInvalidAssignment(`const a: int32 = ┆null┆;`);
    });
    it("enum member", async () => {
      await expectInvalidAssignment(`
        const a: int32 = ┆Direction.up┆;
        enum Direction { up, down }`);
    });

    it("string", async () => {
      await expectInvalidAssignment(`const a: int32 = ┆"abc"┆;`);
    });
    it("numeric", async () => {
      await expectInvalidAssignment(`const a: string = ┆123┆;`);
    });
    it("boolean", async () => {
      await expectInvalidAssignment(`const a: string = ┆true┆;`);
    });
    it("object value", async () => {
      await expectInvalidAssignment(`const a: string = ┆#{ foo: "abc"}┆;`);
    });
    it("array value", async () => {
      await expectInvalidAssignment(`const a: string = ┆#["abc"]┆;`);
    });
  });
});
