import { assert, beforeEach, describe, expect, it } from "vitest";
import {
  unsafe_MutatorFlow as MutatorFlow,
  unsafe_mutateSubgraph as mutateSubgraph,
  type unsafe_Mutator as Mutator,
  type unsafe_TypeRefValue as TypeRefValue,
} from "../../src/experimental/index.js";
import type { Type } from "../../src/index.js";
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

  describe("mutation", () => {
    const renameModels: Mutator = {
      name: "rename referenced models",
      Model: {
        filter: (model) => ["Item", "Base", "Derived"].includes(model.name),
        mutate: (_source, clone) => {
          clone.name = `Changed${clone.name}`;
        },
      },
    };

    it("uses canonical native storage when mapping recursive reference types", async () => {
      const { program, Item, Holder } = await Tester.compile(`
        enum Options { first }
        @test model Item { next?: TypeRef<Item> = typeref(Item); }
        @test model Holder {
          reference: TypeRef<Item>;
          item: Item;
          literal: TypeRef<"item"> = typeref("item");
          member: TypeRef<Options.first> = typeref(Options.first);
        }
      `);
      assert(Item.entityKind === "Type" && Item.kind === "Model");
      assert(Holder.entityKind === "Type" && Holder.kind === "Model");
      const originalStorage = Holder.properties.get("reference")!.type;
      assert(originalStorage.kind === "Scalar");
      const mutator: Mutator = {
        ...renameModels,
        Scalar: (_source, clone) => {
          clone.name = "ChangedScalar";
        },
      };
      const { type: storage } = mutateSubgraph(program, [mutator], originalStorage);
      assert(storage.kind === "Scalar");
      const target = storage.templateMapper!.args[0];
      assert(target.entityKind === "Type" && target.kind === "Model");
      expect(target).toMatchObject({ name: "ChangedItem" });
      expect(storage).toBe(program.checker.getTypeRefType(target));
      expect(target.properties.get("next")!.type).toBe(storage);
      const reference = target.properties.get("next")!.defaultValue;
      assert(reference?.valueKind === "TypeRefValue");
      expect(reference.type).toBe(storage);
      expect(reference.target).toBe(target);

      const { type: holder } = mutateSubgraph(program, [mutator], Holder);
      assert(holder.kind === "Model");
      expect(holder.properties.get("reference")!.type).toBe(storage);
      expect(holder.properties.get("item")!.type).toBe(target);
      expect(holder.properties.get("literal")!.type).toBe(Holder.properties.get("literal")!.type);
      expect(holder.properties.get("member")!.type).toBe(Holder.properties.get("member")!.type);
      expect(originalStorage.templateMapper!.args[0]).toBe(Item);
      expect(Item.properties.get("next")!.type).toBe(originalStorage);
      const declaration = program
        .getGlobalNamespaceType()
        .namespaces.get("TypeSpec")!
        .scalars.get("TypeRef")!;
      expect(mutateSubgraph(program, [mutator], declaration).type).toBe(declaration);
    });

    it("preserves unchanged reference graphs and native storage", async () => {
      const { program, Holder } = await Tester.compile(`
        model Item {}
        @test model Holder { reference: TypeRef<Item> = typeref(Item); }
      `);
      assert(Holder.entityKind === "Type" && Holder.kind === "Model");
      const reference = Holder.properties.get("reference")!;
      const mutator: Mutator = {
        name: "leave models unchanged",
        Model: { filter: () => false, mutate: () => {} },
      };
      expect(mutateSubgraph(program, [mutator], Holder)).toEqual({ type: Holder, realm: null });
      assert(reference.type.kind === "Scalar");
      expect(mutateSubgraph(program, [mutator], reference.type).type).toBe(reference.type);
    });

    it.each(["TypeRef<Base>", "TypeRef<Base> | string", "unknown"])(
      "maps %s storage independently of the precise target",
      async (annotation) => {
        const { program, Holder, Derived } = await referenceTester.compile(`
          extern dec capture(target, reference: valueof unknown);
          model Base {}
          @test model Derived extends Base { name: string; }
          const reference: ${annotation} = typeref(Derived);
          @capture(reference)
          @test model Holder { reference: ${annotation} = reference; }
        `);
        assert(Holder.entityKind === "Type" && Holder.kind === "Model");
        const original = Holder.properties.get("reference")!.defaultValue;
        assert(original?.valueKind === "TypeRefValue");
        const { type } = mutateSubgraph(program, [renameModels], Holder);
        assert(type.kind === "Model");
        const reference = type.properties.get("reference")!.defaultValue;
        assert(reference?.valueKind === "TypeRefValue" && reference.target.kind === "Model");
        expect(reference.target).toMatchObject({ name: "ChangedDerived" });
        expect(reference.target.baseModel).toMatchObject({ name: "ChangedBase" });
        const storage = program.checker.getTypeRefType(reference.target.baseModel!);
        for (const value of [reference, references.at(-1)!]) {
          if (annotation === "unknown") {
            expect(value.type).toBe(original.type);
          } else if (annotation === "TypeRef<Base>") {
            expect(value.type).toBe(storage);
          } else {
            assert(value.type.kind === "Union");
            expect([...value.type.variants.values()].map((variant) => variant.type)).toContain(
              storage,
            );
          }
        }
        expect(reference.type).toBe(type.properties.get("reference")!.type);
        expect(references.at(-1)!.target).toBe(reference.target);
        const argument = type.decorators.find((dec) => dec.definition?.name === "@capture")!
          .args[0];
        expect(argument.value).toBe(argument.jsValue);
        expect(original.target).toBe(Derived);
        expect(type.isFinished).toEqual(true);
      },
    );

    it("updates nested checked and marshalled decorator values", async () => {
      type Registration = { primary: TypeRefValue; alternatives: TypeRefValue[] };
      const registrations = new Map<Type, Registration>();
      const { program, Holder, Item } = await Tester.files({
        "register.js": mockFile.js({
          $register: (_context: unknown, target: Type, value: Registration) => {
            registrations.set(target, value);
          },
        }),
      }).import("./register.js").compile(`
          extern dec register(target, value: valueof {
            primary: TypeRef;
            alternatives: TypeRef[];
          });
          @test model Item {}
          @register(#{ primary: typeref(Item), alternatives: #[typeref(Item)] })
          @test model Holder {}
        `);
      assert(Holder.entityKind === "Type" && Holder.kind === "Model");
      const { type } = mutateSubgraph(program, [renameModels], Holder);
      assert(type.kind === "Model");
      const registration = registrations.get(type)!;
      expect(registration.primary.target).toMatchObject({ name: "ChangedItem" });
      expect(registration.alternatives[0].target).toBe(registration.primary.target);
      const checked = type.decorators.find((dec) => dec.definition?.name === "@register")!.args[0]
        .value;
      assert(checked.entityKind === "Value" && checked.valueKind === "ObjectValue");
      expect(checked.properties.get("primary")!.value).toBe(registration.primary);
      const alternatives = checked.properties.get("alternatives")!.value;
      assert(alternatives.valueKind === "ArrayValue");
      expect(alternatives.values[0]).toBe(registration.alternatives[0]);
      expect(registrations.get(Holder)!.primary.target).toBe(Item);
    });

    it("keeps template arguments, substitutions, and defaults consistent", async () => {
      const { program, Holder } = await Tester.compile(`
        model Item {}
        model Entry<R extends valueof TypeRef<Item>, Label> {
          reference: TypeRef<Item> = R;
        }
        @test model Holder { entry: Entry<typeref(Item), "entry">; }
      `);
      assert(Holder.entityKind === "Type" && Holder.kind === "Model");
      const original = Holder.properties.get("entry")!.type;
      assert(original.kind === "Model");
      const { type } = mutateSubgraph(program, [renameModels], Holder);
      assert(type.kind === "Model");
      const entry = type.properties.get("entry")!.type;
      assert(entry.kind === "Model");
      const mapper = entry.templateMapper!;
      const argument = mapper.args[0];
      assert(argument.entityKind === "Value" && argument.valueKind === "TypeRefValue");
      const parameter = mapper.map.keys().next().value!;
      expect(mapper.map.get(parameter)).toBe(argument);
      expect(mapper.getMappedType(parameter)).toBe(argument);
      expect(argument.target).toMatchObject({ name: "ChangedItem" });
      expect(argument.type).toBe(program.checker.getTypeRefType(argument.target));
      const reference = entry.properties.get("reference")!.defaultValue;
      assert(reference?.valueKind === "TypeRefValue");
      expect(reference.target).toBe(argument.target);
      expect(reference.type).toBe(argument.type);
      expect(mapper.args[1]).toBe(original.templateMapper!.args[1]);
      expect(original.templateMapper!.getMappedType(parameter)).toBe(
        original.templateMapper!.args[0],
      );
    });

    it("maps scalar constructor storage and reference arguments", async () => {
      const { program, Holder } = await Tester.compile(`
        model Item {}
        scalar Registration { init create(reference: TypeRef<Item>); }
        @test model Holder {
          registration: Registration = Registration.create(typeref(Item));
        }
      `);
      assert(Holder.entityKind === "Type" && Holder.kind === "Model");
      const original = Holder.properties.get("registration")!.defaultValue;
      assert(original?.valueKind === "ScalarValue");
      const mutator: Mutator = {
        ...renameModels,
        Scalar: (_source, clone) => {
          clone.name = `Changed${clone.name}`;
        },
      };
      const { type } = mutateSubgraph(program, [mutator], Holder);
      assert(type.kind === "Model");
      const property = type.properties.get("registration")!;
      const value = property.defaultValue;
      assert(value?.valueKind === "ScalarValue");
      expect(value.type).toBe(property.type);
      expect(value.scalar).toBe(property.type);
      expect(value.scalar.name).toEqual("ChangedRegistration");
      const reference = value.value.args[0];
      assert(reference.valueKind === "TypeRefValue");
      expect(reference.target).toMatchObject({ name: "ChangedItem" });
      expect(reference.type).toBe(program.checker.getTypeRefType(reference.target));
      expect(original.scalar.name).toEqual("Registration");
      expect(original.value.args[0]).toMatchObject({ target: { name: "Item" } });
    });

    it("honors the active mutators for reference constraints and values", async () => {
      const { program, Item, Holder } = await Tester.compile(`
        @test model Item {}
        model Filtered { reference: TypeRef<Item> = typeref(Item); }
        @test model Holder { item: Item; filtered: Filtered; }
      `);
      assert(Item.entityKind === "Type" && Item.kind === "Model");
      assert(Holder.entityKind === "Type" && Holder.kind === "Model");
      const filteredRename: Mutator = {
        ...renameModels,
        Model: {
          filter: (model) =>
            model.name === "Filtered"
              ? MutatorFlow.DoNotMutate | MutatorFlow.DoNotRecur
              : model.name === "Item",
          mutate: (_source, clone) => {
            clone.name = `Changed${clone.name}`;
          },
        },
      };
      const cloneFiltered: Mutator = {
        name: "clone the filtered owner",
        Model: {
          filter: (model) => model.name === "Filtered",
          mutate: () => {},
        },
      };
      const { type } = mutateSubgraph(program, [filteredRename, cloneFiltered], Holder);
      assert(type.kind === "Model");
      expect(type.properties.get("item")!.type).toMatchObject({ name: "ChangedItem" });
      const filtered = type.properties.get("filtered")!.type;
      assert(filtered.kind === "Model");
      const reference = filtered.properties.get("reference")!.defaultValue;
      assert(reference?.valueKind === "TypeRefValue");
      expect(reference.target).toBe(Item);
      expect(reference.type).toBe(program.checker.getTypeRefType(Item));
    });

    it("finishes recursive decorator state with the same mapped reference value", async () => {
      const targets = new Map<Type, Type>();
      const { program, Item, Holder } = await Tester.files({
        "capture.js": mockFile.js({
          $capture: (_context: unknown, target: Type, reference: TypeRefValue) => {
            targets.set(target, reference.target);
          },
        }),
      }).import("./capture.js").compile(`
          extern dec capture(target, reference: valueof TypeRef);
          @capture(reference)
          @test model Item {}
          const reference = typeref(Item);
          @capture(reference)
          @test model Holder {}
        `);
      assert(Item.entityKind === "Type" && Item.kind === "Model");
      assert(Holder.entityKind === "Type" && Holder.kind === "Model");
      const { type } = mutateSubgraph(program, [renameModels], Holder);
      assert(type.kind === "Model");
      const target = targets.get(type)!;
      expect(target).toMatchObject({ name: "ChangedItem" });
      expect(targets.get(target)).toBe(target);
      const ownerArgument = type.decorators.find((dec) => dec.definition?.name === "@capture")!
        .args[0];
      assert(target.kind === "Model");
      const targetArgument = target.decorators.find((dec) => dec.definition?.name === "@capture")!
        .args[0];
      expect(ownerArgument.value).toBe(ownerArgument.jsValue);
      expect(targetArgument.value).toBe(ownerArgument.value);
      expect(targets.get(Item)).toBe(Item);
    });
  });
});
