import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { expectDiagnostics } from "../../../src/testing/expect.js";
import { compileValueType, diagnoseUsage } from "./utils.js";

describe("without type it use the most precise type", () => {
  it.each([
    ["1", "Number"],
    [`"abc"`, "String"],
    [`true`, "Boolean"],
    [`#{foo: "abc"}`, "Model"],
    [`#["abc"]`, "Tuple"],
  ])("%s => %s", async (input, kind) => {
    const value = await compileValueType("a", `const a = ${input};`);
    strictEqual(value.type.kind, kind);
  });
});

it("when assigning another const it change the type", async () => {
  const value = await compileValueType("b", `const a: int32 = 123;const b: int64 = a;`);
  strictEqual(value.type.kind, "Scalar");
  strictEqual(value.type.name, "int64");
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
