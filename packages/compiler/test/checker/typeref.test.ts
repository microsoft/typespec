import { assert, beforeEach, describe, expect, it } from "vitest";
import {
  getSourceLocation,
  isTypeRefType,
  resolvePath,
  type Type,
  type TypeRefValue,
} from "../../src/index.js";
import {
  createTester,
  expectDiagnostics,
  mockFile,
  type Tester as TesterInstance,
} from "../../src/testing/index.js";
import { Tester as BaseTester } from "../tester.js";

const Tester = createTester(resolvePath(import.meta.dirname, "../.."), {
  libraries: [],
  features: ["typeref"],
});

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
    assert(isTypeRefType(program, storage));
    expect(program.checker.isStdType(storage)).toEqual(false);
    expect(storage.templateMapper?.args[0]).toBe(models.get("Item"));
    expect(references[1].type).toBe(storage);
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
            features: ["function-declarations", "typeref"],
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

  it("compares mutually recursive reference targets", async () => {
    await Tester.compile(`
      model Item { next?: TypeRef<Link>; }
      model Link { next?: TypeRef<Item>; id: string; }
      model DetailedItem { next?: TypeRef<DetailedLink>; name: string; }
      model DetailedLink { next?: TypeRef<DetailedItem>; id: string; }
      const reference: TypeRef<Item> = typeref(DetailedItem);
    `);
    const diagnostics = await Tester.diagnose(`
      model Item { next?: TypeRef<Link>; }
      model Link { next?: TypeRef<Item>; id: string; }
      model OtherItem { next?: TypeRef<OtherLink>; }
      model OtherLink { next?: TypeRef<OtherItem>; count: int32; }
      const reference: TypeRef<Item> = typeref(OtherItem);
    `);
    expectDiagnostics(diagnostics, { code: "unassignable" });
  });

  it.each(["typeref", "createReference"])("requires the feature when calling %s", async (name) => {
    const diagnostics = await BaseTester.diagnose(`
      model Item {}
      const createReference = typeref;
      const reference = ${name}(Item);
    `);
    expectDiagnostics(diagnostics, {
      code: "typeref-disabled",
      severity: "error",
      message:
        "The typeref function requires the 'typeref' feature to be enabled. Add 'typeref' to the 'features' list in your tspconfig.yaml.",
    });
    const location = getSourceLocation(diagnostics[0].target);
    assert(location);
    expect(location.file.text.slice(location.pos, location.end)).toEqual(`${name}(Item)`);
  });

  it("does not require the feature until the function is called", async () => {
    await BaseTester.compile(`
      model Item {}
      const createReference = typeref;
    `);
  });

  it("uses the feature enabled by the library that calls typeref", async () => {
    await BaseTester.files({
      "node_modules/my-lib/package.json": JSON.stringify({ name: "my-lib", tspMain: "main.tsp" }),
      "node_modules/my-lib/tspconfig.yaml": "kind: project\nfeatures:\n  - typeref\n",
      "node_modules/my-lib/main.tsp": `
        namespace MyLib;
        model Item {}
        const reference = typeref(Item);
      `,
    })
      .import("my-lib")
      .compile("");
  });

  it("does not enable library calls through the consumer's feature flag", async () => {
    const diagnostics = await Tester.files({
      "node_modules/my-lib/package.json": JSON.stringify({ name: "my-lib", tspMain: "main.tsp" }),
      "node_modules/my-lib/main.tsp": `
        namespace MyLib;
        model Item {}
        const reference = typeref(Item);
      `,
    })
      .import("my-lib")
      .diagnose("");
    expectDiagnostics(diagnostics, { code: "typeref-disabled" });
  });

  it("checks the caller's feature flag rather than the referenced type's library", async () => {
    const diagnostics = await BaseTester.files({
      "node_modules/my-lib/package.json": JSON.stringify({ name: "my-lib", tspMain: "main.tsp" }),
      "node_modules/my-lib/tspconfig.yaml": "kind: project\nfeatures:\n  - typeref\n",
      "node_modules/my-lib/main.tsp": "namespace MyLib; model Item {}",
    })
      .import("my-lib")
      .diagnose("const reference = typeref(MyLib.Item);");
    expectDiagnostics(diagnostics, { code: "typeref-disabled" });
  });
});
