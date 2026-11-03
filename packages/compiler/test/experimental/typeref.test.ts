import { assert, beforeEach, describe, expect, it } from "vitest";
import type { Type, TypeRefValue } from "../../src/index.js";
import {
  expectDiagnostics,
  mockFile,
  type Tester as TesterInstance,
} from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("typeref", () => {
  const declaration = "extern dec capture(target, reference: valueof TypeRef);";
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
    expect(references[0]).toMatchObject({
      entityKind: "Value",
      valueKind: "TypeRefValue",
      type: { kind: "Scalar", name: "TypeRef" },
    });
    const storage = references[0].type;
    assert(storage.kind === "Scalar");
    expect(storage.templateMapper?.args[0]).toBe(models.get("Item"));
    expect(models.get("Storage")!.properties.get("reference")!.type).toBe(storage);
    expect(references[0].target).toBe(models.get("Item"));
    expect(references[1].target).toBe(references[0].target);
    expect(references[2].target).toBe(models.get("OtherItem"));
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
    expect(references[0].target.kind).toEqual(kind);
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
    assert(target.kind === "Union");
    const [tuple, error] = [...target.variants.values()].map((variant) => variant.type);
    assert(tuple.kind === "Tuple");
    const models = program.getGlobalNamespaceType().models;
    expect(tuple.values[0]).toBe(models.get("Input"));
    expect(tuple.values[1]).toBe(models.get("Output"));
    expect(error).toBe(models.get("ErrorResult"));
  });

  it("can reference the namespace being decorated", async () => {
    const { program } = await referenceTester.compile(`
      ${declaration}
      @capture(typeref(Service))
      namespace Service {}
    `);
    expect(references[0].target).toBe(program.getGlobalNamespaceType().namespaces.get("Service"));
  });

  it("accepts compatible referenced types and preserves the precise target", async () => {
    const { program } = await referenceTester.compile(`
      ${declaration}
      model Item { id: string; }
      model DetailedItem extends Item { count: int32; }
      const exact: TypeRef<DetailedItem> = typeref(DetailedItem);
      const compatible: TypeRef<Item> = exact;
      @capture(compatible) model Test {}
      const literal: TypeRef<"item"> = typeref("item");
    `);
    expect(references[0].target).toBe(program.getGlobalNamespaceType().models.get("DetailedItem"));
  });

  it.each(["123", '"item"', "#{}"])(
    "rejects a non-reference value assigned to an inferred reference type: %s",
    async (value) => {
      const diagnostics = await Tester.diagnose(`
        model Item {}
        const reference = typeref(Item);
        const notAReference: typeof reference = ${value};
      `);
      expectDiagnostics(diagnostics, { code: "unassignable" });
    },
  );

  it("rejects a reference whose target does not satisfy the generic constraint", async () => {
    const diagnostics = await Tester.diagnose(`
      model Item { id: string; }
      model OtherItem { count: int32; }
      const reference: TypeRef<Item> = typeref(OtherItem);
    `);
    expectDiagnostics(diagnostics, { code: "unassignable" });
  });

  it("supports reflection-type constraints on the referenced type", async () => {
    await Tester.compile(`
      model Item {}
      const reference: TypeRef<TypeSpec.Reflection.Model> = typeref(Item);
    `);
    const diagnostics = await Tester.diagnose(`
      const reference: TypeRef<TypeSpec.Reflection.Model> = typeref(string);
    `);
    expectDiagnostics(diagnostics, { code: "unassignable" });
  });

  it("compares recursively constrained reference targets", async () => {
    await Tester.compile(`
      model Item { next?: TypeRef<Item>; }
      model DetailedItem { next?: TypeRef<DetailedItem>; id: string; }
      const reference: TypeRef<Item> = typeref(DetailedItem);
    `);
  });

  it("rejects scalar constructor values masquerading as type references", async () => {
    const diagnostics = await Tester.diagnose(`
      model Item {}
      scalar Fake extends TypeRef<Item> { init create(); }
      const reference: TypeRef<Item> | string = Fake.create();
    `);
    expectDiagnostics(diagnostics, { code: "unassignable" });
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
    const { program } = await nestedTester.compile(
      `
      extern fn pass(value: valueof unknown): valueof unknown;
      model Registration {
        primary: TypeRef;
        alternatives: TypeRef[];
      }
      extern dec nested(target, registration: valueof Registration);
      model Item {}
      const base = #{ primary: typeref(Item) };
      const registration = #{ ...base, alternatives: #[typeref(Item)] };
      @nested(pass(registration)) model Test {}
    `,
      {
        compilerOptions: {
          configFile: {
            projectRoot: ".",
            kind: "project",
            features: ["function-declarations"],
            diagnostics: [],
            outputDir: "tsp-output",
          },
        },
      },
    );
    assert(registration);
    const item = program.getGlobalNamespaceType().models.get("Item");
    expect(registration.primary.valueKind).toEqual("TypeRefValue");
    expect(registration.primary.target).toBe(item);
    expect(registration.alternatives[0].target).toBe(item);
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
