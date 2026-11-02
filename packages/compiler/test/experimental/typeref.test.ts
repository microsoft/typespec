import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, expect, it } from "vitest";
import type { Type, TypeRefValue } from "../../src/index.js";
import {
  expectDiagnostics,
  mockFile,
  type Tester as TesterInstance,
} from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("typeref", () => {
  const declaration = "extern dec capture(target, reference: valueof unknown);";
  let references: TypeRefValue[];
  let referenceTester: TesterInstance;

  beforeEach(() => {
    references = [];
    referenceTester = Tester.files({
      "capture.js": mockFile.js({
        $capture: (_context: unknown, _target: Type, reference: TypeRefValue) => {
          references.push(reference);
        },
      }),
    }).import("./capture.js");
  });

  it("preserves model identity through aliases without merging distinct declarations", async () => {
    const { program } = await referenceTester.compile(`
      ${declaration}
      model Item {}
      model OtherItem {}
      alias ItemAlias = Item;
      const createReference = TypeSpec.typeref;
      @capture(typeref(Item)) model First {}
      @capture(createReference(ItemAlias)) model Second {}
      @capture(typeref(OtherItem)) model Third {}
      model Storage { reference: typeof typeref(Item); }
    `);
    const models = program.getGlobalNamespaceType().models;
    strictEqual(references[0].entityKind, "Value");
    strictEqual(references[0].valueKind, "TypeRefValue");
    strictEqual(references[0].type, program.checker.unknownType);
    strictEqual(models.get("Storage")!.properties.get("reference")!.type, references[0].type);
    strictEqual(references[0].target, models.get("Item"));
    strictEqual(references[1].target, references[0].target);
    strictEqual(references[2].target, models.get("OtherItem"));
    expect(references[2].target).not.toBe(references[0].target);
  });

  it.each([
    ["namespace", "namespace Service {}", "Service", "Namespace"],
    ["template instance", "model Item<T> { value: T; }", "Item<string>", "Model"],
    ["scalar", "", "string", "Scalar"],
    ["literal type", "", '"Item"', "String"],
  ])("accepts a %s target", async (_name, setup, target, kind) => {
    await referenceTester.compile(`
      ${declaration}
      ${setup}
      @capture(typeref(${target})) model Test {}
    `);
    strictEqual(references[0].target.kind, kind);
  });

  it("preserves an entire union and its tuple alternatives", async () => {
    const { program } = await referenceTester.compile(`
      ${declaration}
      model Input {}
      model Output {}
      model ErrorResult {}
      alias Alternatives = [Input, Output] | ErrorResult;
      @capture(typeref(Alternatives)) model Test {}
    `);
    const target = references[0].target;
    strictEqual(target.kind, "Union");
    const [tuple, error] = [...target.variants.values()].map((variant) => variant.type);
    strictEqual(tuple.kind, "Tuple");
    const models = program.getGlobalNamespaceType().models;
    deepStrictEqual(tuple.values, [models.get("Input"), models.get("Output")]);
    strictEqual(error, models.get("ErrorResult"));
  });

  it("can reference the namespace being decorated", async () => {
    const { program } = await referenceTester.compile(`
      ${declaration}
      @capture(typeref(Service))
      namespace Service {}
    `);
    strictEqual(references[0].target, program.getGlobalNamespaceType().namespaces.get("Service"));
  });

  it("preserves references in nested values, spreads, and function round trips", async () => {
    let registration: { primary: TypeRefValue; alternatives: TypeRefValue[] } | undefined;
    const nestedTester = Tester.files({
      "nested.js": mockFile.js({
        $nested: (
          _context: unknown,
          _target: Type,
          value: { primary: TypeRefValue; alternatives: TypeRefValue[] },
        ) => {
          registration = value;
        },
        $functions: { "": { pass: (_context: unknown, value: unknown) => value } },
      }),
    }).import("./nested.js");
    const { program } = await nestedTester.compile(`
      #suppress "experimental-feature"
      extern fn pass(value: valueof unknown): valueof unknown;
      model Registration {
        primary: unknown;
        alternatives: unknown[];
      }
      extern dec nested(target, registration: valueof Registration);
      model Item {}
      const base = #{ primary: typeref(Item) };
      const registration = #{ ...base, alternatives: #[typeref(Item)] };
      @nested(pass(registration)) model Test {}
    `);
    ok(registration);
    const item = program.getGlobalNamespaceType().models.get("Item");
    strictEqual(registration.primary.valueKind, "TypeRefValue");
    strictEqual(registration.primary.target, item);
    strictEqual(registration.alternatives[0].target, item);
  });

  it.each(["#{ }", '"Item"'])("rejects a value operand: %s", async (value) => {
    const diagnostics = await Tester.diagnose(`
      const value = ${value};
      const reference = typeref(value);
    `);
    expectDiagnostics(diagnostics, { code: "value-in-type" });
  });

  it.each(["", "string, string"])("rejects the wrong number of arguments: (%s)", async (args) => {
    const diagnostics = await Tester.diagnose(`const reference = typeref(${args});`);
    expectDiagnostics(diagnostics, { code: "invalid-argument-count" });
  });

  it("rejects using a reference as a value of the referenced type", async () => {
    const diagnostics = await Tester.diagnose(`
      model Item { id: string; }
      const item: Item = typeref(Item);
    `);
    expectDiagnostics(diagnostics, { code: "unassignable" });
  });
});
