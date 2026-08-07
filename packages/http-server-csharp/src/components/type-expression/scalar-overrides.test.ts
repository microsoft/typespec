import { Tester } from "#test/tester.js";
import { type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, expect, it } from "vitest";
import { getServerScalarName } from "./scalar-overrides.js";

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

async function scalarName(ref: string): Promise<string> {
  await runner.compile(`
    model Test { test: ${ref}; }
  `);
  const tk = $(runner.program);
  const model = runner.program.resolveTypeReference("Test")[0];
  const scalar = (model as any).properties.get("test").type;
  return getServerScalarName(tk, scalar);
}

it.each([
  // Server overrides of the emitter-framework defaults.
  ["plainDate", "DateTime"],
  ["plainTime", "DateTime"],
  ["url", "string"],
  ["safeint", "long"],
  ["int8", "SByte"],
  ["uint8", "Byte"],
  ["int16", "Int16"],
  ["uint16", "UInt16"],
  ["uint32", "UInt32"],
  ["uint64", "UInt64"],
  // Inherited from the emitter-framework defaults.
  ["string", "string"],
  ["int32", "int"],
  ["int64", "long"],
  ["float32", "float"],
  ["float64", "double"],
  ["boolean", "bool"],
  ["bytes", "byte[]"],
  ["decimal", "decimal"],
  ["utcDateTime", "DateTimeOffset"],
  ["offsetDateTime", "DateTimeOffset"],
  ["duration", "TimeSpan"],
])("%s => %s", async (tspType, csType) => {
  expect(await scalarName(tspType)).toBe(csType);
});

it("resolves custom scalars through the base they extend", async () => {
  await runner.compile(`
    scalar myDate extends plainDate;
    model Test { test: myDate; }
  `);
  const tk = $(runner.program);
  const model = runner.program.resolveTypeReference("Test")[0];
  const scalar = (model as any).properties.get("test").type;
  expect(getServerScalarName(tk, scalar)).toBe("DateTime");
});
