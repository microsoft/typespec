import { createTestHost, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { generateExternDecorators } from "../../src/gen-extern-signatures/gen-extern-signatures.js";

async function generateDecoratorSignatures(code: string) {
  const host = await createTestHost();
  host.addTypeSpecFile(
    "main.tsp",
    `
    using TypeSpec.Reflection;
    ${code}`
  );
  await host.diagnose("main.tsp", {
    parseOptions: { comments: true, docs: true },
  });

  expectDiagnosticEmpty(
    host.program.diagnostics.filter((x) => x.code !== "missing-implementation")
  );

  const result = await generateExternDecorators(host.program, "test-lib", { printWidth: 100 });

  return result["decorators.ts"];
}

async function expectSignatures({ code, expected }: { code: string; expected: string }) {
  const result = await generateDecoratorSignatures(code);
  expect(result.trim()).toEqual(expected.trim());
}

it("generate simple decorator with no parameters", async () => {
  await expectSignatures({
    code: `extern dec simple(target);`,
    expected: `
import { DecoratorContext, Type } from "@typespec/compiler";

export type SimpleDecorator = (context: DecoratorContext, target: Type) => void;
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
import { DecoratorContext, ${expected} } from "@typespec/compiler";

export type SimpleDecorator = (context: DecoratorContext, target: ${expected}) => void;
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
import { DecoratorContext, ${expected.join(", ")} } from "@typespec/compiler";

export type SimpleDecorator = (context: DecoratorContext, target: ${expected.join(" | ")}) => void;
    `,
      });
    });
  });

  describe("single valueof", () => {
    it.each([
      ["valueof string", "string"],
      ["valueof boolean", "boolean"],
      ["valueof int32", "number"],
      ["valueof int8", "number"],
      ["valueof uint64", "number"],
      ["valueof int64", "number"],
    ])("%s => %s", async (ref, expected) => {
      await expectSignatures({
        code: `extern dec simple(target: ${ref});`,
        expected: `
import { DecoratorContext } from "@typespec/compiler";

export type SimpleDecorator = (context: DecoratorContext, target: ${expected}) => void;
    `,
      });
    });
  });

  describe("actual types", () => {
    it.each([
      ["model Options { name: string, other: string }", "Options", "TypeSpecValue"],
      ["enum Direction { up, down }", "Direction", "TypeSpecValue"],
    ])("%s", async (code, ref, expected) => {
      await expectSignatures({
        code: `extern dec simple(target: ${ref});\n${code}`,
        expected: `
import { DecoratorContext, ${expected} } from "@typespec/compiler";

export type SimpleDecorator = (context: DecoratorContext, target: ${expected}) => void;
    `,
      });
    });
  });
});
