import type {
  Entity,
  MemberType,
  Model,
  ModelProperty,
  Operation,
  Scalar,
  Type,
  Union,
  UnionVariant,
} from "@typespec/compiler";
import { expectTypeEquals, t, type TemplateWithMarkers } from "@typespec/compiler/testing";
import type { Typekit } from "@typespec/compiler/typekit";
import { $ } from "@typespec/compiler/typekit";
import { describe, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import { MutationHalfEdge, type MutationTraits } from "./mutation-engine.js";
import type { MutationInfo } from "./mutation.js";
import {
  SimpleModelPropertyMutation,
  SimpleMutationEngine,
  SimpleMutationOptions,
  SimpleOperationMutation,
  SimpleUnionVariantMutation,
} from "./simple-mutation-engine.js";

// --- Helpers ---

async function compile<T extends Record<string, Entity>>(code: TemplateWithMarkers<T>) {
  const runner = await Tester.createInstance();
  const result = await runner.compile(code);
  return { ...result, tk: $(result.program) };
}

function createPropertyEngine(
  tk: Typekit,
  MutationClass: typeof SimpleModelPropertyMutation<SimpleMutationOptions>,
) {
  return new SimpleMutationEngine<{
    ModelProperty: SimpleModelPropertyMutation<SimpleMutationOptions>;
  }>(tk, {
    ModelProperty: MutationClass,
  } as any);
}

function createOperationEngine(
  tk: Typekit,
  MutationClass: typeof SimpleOperationMutation<SimpleMutationOptions>,
) {
  return new SimpleMutationEngine<{ Operation: SimpleOperationMutation<SimpleMutationOptions> }>(
    tk,
    {
      Operation: MutationClass,
    } as any,
  );
}

function createVariantEngine(
  tk: Typekit,
  MutationClass: typeof SimpleUnionVariantMutation<SimpleMutationOptions>,
) {
  return new SimpleMutationEngine<{
    UnionVariant: SimpleUnionVariantMutation<SimpleMutationOptions>;
  }>(tk, {
    UnionVariant: MutationClass,
  } as any);
}

/** Creates a ModelProperty mutation class that replaces the property type using replaceAndMutateReference */
function createReplacePropertyMutation(getAlternate: (prop: ModelProperty) => Type | undefined) {
  return class extends SimpleModelPropertyMutation<SimpleMutationOptions> {
    mutate() {
      const alternate = getAlternate(this.sourceType);
      if (alternate) {
        this.mutationNode.mutate((prop) => {
          prop.type = alternate;
        });
        this.type = this.engine.replaceAndMutateReference(
          this.sourceType,
          alternate,
          this.options,
          this.startTypeEdge(),
        );
      } else {
        super.mutate();
      }
    }
  };
}

/** Creates a UnionVariant mutation class that replaces the variant type using replaceAndMutateReference */
function createReplaceVariantMutation(getAlternate: (variant: UnionVariant) => Type | undefined) {
  return class extends SimpleUnionVariantMutation<SimpleMutationOptions> {
    mutate() {
      const alternate = getAlternate(this.sourceType);
      if (alternate) {
        this.mutationNode.mutate((variant) => {
          variant.type = alternate;
        });
        this.type = this.engine.replaceAndMutateReference(
          this.sourceType,
          alternate,
          this.options,
          this.startTypeEdge(),
        );
      } else {
        super.mutate();
      }
    }
  };
}

/**
 * Creates a ModelProperty mutation class that replaces the property type from mutationInfo,
 * using a type map to resolve alternates. This tests the interceptor pattern where
 * replacement happens before the mutation is constructed.
 */
function createMutationInfoPropertyReplacement(alternateTypeMap: Map<Type, Type>) {
  return class AlternateTypePropertyViaInfo extends SimpleModelPropertyMutation<SimpleMutationOptions> {
    static mutationInfo(
      engine: SimpleMutationEngine<{ ModelProperty: AlternateTypePropertyViaInfo }>,
      sourceType: ModelProperty,
      referenceTypes: MemberType[],
      options: SimpleMutationOptions,
      halfEdge?: MutationHalfEdge,
      traits?: MutationTraits,
    ): MutationInfo | AlternateTypePropertyViaInfo {
      let referencedType: Type = sourceType.type;
      while (referencedType.kind === "ModelProperty" || referencedType.kind === "UnionVariant") {
        referencedType = (referencedType as any).type;
      }

      const alternate = alternateTypeMap.get(referencedType);
      if (alternate) {
        return engine.replaceAndMutateReference(sourceType, alternate, options, halfEdge) as any;
      }

      return super.mutationInfo(
        engine,
        sourceType,
        referenceTypes,
        options,
        halfEdge,
        traits,
      ) as MutationInfo;
    }
  };
}

/**
 * Creates a UnionVariant mutation class that replaces the variant type from mutationInfo,
 * using a type map to resolve alternates.
 */
function createMutationInfoVariantReplacement(alternateTypeMap: Map<Type, Type>) {
  return class AlternateTypeVariantViaInfo extends SimpleUnionVariantMutation<SimpleMutationOptions> {
    static mutationInfo(
      engine: SimpleMutationEngine<{ UnionVariant: AlternateTypeVariantViaInfo }>,
      sourceType: UnionVariant,
      referenceTypes: MemberType[],
      options: SimpleMutationOptions,
      halfEdge?: MutationHalfEdge,
      traits?: MutationTraits,
    ): MutationInfo | AlternateTypeVariantViaInfo {
      let referencedType: Type = sourceType.type;
      while (referencedType.kind === "ModelProperty" || referencedType.kind === "UnionVariant") {
        referencedType = (referencedType as any).type;
      }

      const alternate = alternateTypeMap.get(referencedType);
      if (alternate) {
        return engine.replaceAndMutateReference(sourceType, alternate, options, halfEdge) as any;
      }

      return super.mutationInfo(
        engine,
        sourceType,
        referenceTypes,
        options,
        halfEdge,
        traits,
      ) as MutationInfo;
    }
  };
}

function expectModelType(type: Type, name: string) {
  expect(type.kind).toBe("Model");
  expect((type as Model).name).toBe(name);
}

/**
 * Tests for the `@alternateType` pattern where a property/returnType/variant type is
 * replaced with a different type during mutation.
 *
 * The `replaceAndMutateReference` method handles the case where the half-edge expects
 * a member type (ModelProperty/UnionVariant) but the replacement is a different kind
 * (e.g., Model). It creates a "stub member mutation" that wraps the replacement.
 */
describe("type replacement (@alternateType pattern)", () => {
  describe("ModelProperty.type via replaceAndMutateReference", () => {
    it("replaces property type with a model type", async () => {
      const { Foo, Bar, tk } = await compile(t.code`
        model ${t.model("Foo")} {
          prop: string;
        }

        model ${t.model("Bar")} {
          name: string;
        }
      `);

      const Mutation = createReplacePropertyMutation(() => Bar);
      const engine = createPropertyEngine(tk, Mutation);

      const fooMutation = engine.mutate(Foo);
      const propMutation = fooMutation.properties.get("prop")!;

      expectModelType(propMutation.mutatedType.type, "Bar");
      expect(Foo.properties.get("prop")!.type.kind).toBe("Scalar");
    });

    it("replacement type referenced by multiple properties shares the same mutation instance", async () => {
      const { Foo, program, tk } = await compile(t.code`
        model ${t.model("Foo")} {
          prop1: Bar;
          prop2: string;
        }

        model ${t.model("Bar")} {
          value: int32;
        }
      `);

      const Bar = program.getGlobalNamespaceType().models.get("Bar")!;
      const Mutation = createReplacePropertyMutation((prop) =>
        prop.name === "prop2" ? Bar : undefined,
      );
      const engine = createPropertyEngine(tk, Mutation);

      const fooMutation = engine.mutate(Foo);
      const prop1 = fooMutation.properties.get("prop1")!;
      const prop2 = fooMutation.properties.get("prop2")!;

      expectModelType(prop1.mutatedType.type, "Bar");
      expectModelType(prop2.mutatedType.type, "Bar");
      expectTypeEquals(prop1.mutatedType.type as Model, prop2.mutatedType.type as Model);
    });

    it("recursively processes the replacement type's properties through the mutator", async () => {
      const { Foo, program, tk } = await compile(t.code`
        model ${t.model("Foo")} {
          prop: string;
        }

        model ${t.model("Bar")} {
          inner: int32;
        }

        model ${t.model("Baz")} {
          value: string;
        }
      `);

      const Bar = program.getGlobalNamespaceType().models.get("Bar")!;
      const Baz = program.getGlobalNamespaceType().models.get("Baz")!;

      const alternateTypes = new Map<string, Model>([
        ["prop", Bar],
        ["inner", Baz],
      ]);

      const Mutation = createReplacePropertyMutation((prop) => alternateTypes.get(prop.name));
      const engine = createPropertyEngine(tk, Mutation);

      const fooMutation = engine.mutate(Foo);
      const propMutation = fooMutation.properties.get("prop")!;

      expectModelType(propMutation.mutatedType.type, "Bar");

      // Bar.inner should be recursively replaced with Baz
      const barMutation = propMutation.type;
      expect(barMutation.kind).toBe("Model");
      const innerPropMutation = (barMutation as any).properties.get("inner")!;
      expectModelType(innerPropMutation.mutatedType.type, "Baz");

      // Originals should be unchanged
      expect(Foo.properties.get("prop")!.type.kind).toBe("Scalar");
      expect(Bar.properties.get("inner")!.type.kind).toBe("Scalar");
    });

    it("replaces property type with a union type", async () => {
      const { Foo, MyUnion, tk } = await compile(t.code`
        model ${t.model("Foo")} {
          prop: string;
        }

        union ${t.union("MyUnion")} {
          a: string;
          b: int32;
        }
      `);

      const Mutation = createReplacePropertyMutation(() => MyUnion);
      const engine = createPropertyEngine(tk, Mutation);

      const fooMutation = engine.mutate(Foo);
      const propMutation = fooMutation.properties.get("prop")!;

      expect(propMutation.mutatedType.type.kind).toBe("Union");
      expect((propMutation.mutatedType.type as Union).name).toBe("MyUnion");
      expect(Foo.properties.get("prop")!.type.kind).toBe("Scalar");
    });

    it("replaces property type with a scalar type", async () => {
      const { Foo, program, tk } = await compile(t.code`
        model ${t.model("Foo")} {
          prop: string;
        }

        scalar ${t.scalar("MyScalar")};
      `);

      const MyScalar = program.getGlobalNamespaceType().scalars.get("MyScalar")!;
      const Mutation = createReplacePropertyMutation(() => MyScalar);
      const engine = createPropertyEngine(tk, Mutation);

      const fooMutation = engine.mutate(Foo);
      const propMutation = fooMutation.properties.get("prop")!;

      expect(propMutation.mutatedType.type.kind).toBe("Scalar");
      expect((propMutation.mutatedType.type as Scalar).name).toBe("MyScalar");
    });
  });

  describe("ModelProperty.type via engine.mutate (direct)", () => {
    it("replaces property type directly via engine.mutate", async () => {
      const { Foo, Bar, tk } = await compile(t.code`
        model ${t.model("Foo")} {
          prop: string;
        }

        model ${t.model("Bar")} {
          name: string;
        }
      `);

      class DirectMutateProperty extends SimpleModelPropertyMutation<SimpleMutationOptions> {
        mutate() {
          this.mutationNode.mutate((prop) => {
            prop.type = Bar;
          });
          this.type = this.engine.mutate(Bar, this.options, this.startTypeEdge());
        }
      }

      const engine = createPropertyEngine(tk, DirectMutateProperty);

      const fooMutation = engine.mutate(Foo);
      const propMutation = fooMutation.properties.get("prop")!;

      expectModelType(propMutation.mutatedType.type, "Bar");
      expect(Foo.properties.get("prop")!.type.kind).toBe("Scalar");
    });

    it("recursively processes replacement type's properties", async () => {
      const { Foo, program, tk } = await compile(t.code`
        model ${t.model("Foo")} {
          prop: string;
        }

        model ${t.model("Bar")} {
          inner: int32;
        }

        model ${t.model("Baz")} {
          value: string;
        }
      `);

      const Bar = program.getGlobalNamespaceType().models.get("Bar")!;
      const Baz = program.getGlobalNamespaceType().models.get("Baz")!;

      const alternateTypes = new Map<string, Model>([
        ["prop", Bar],
        ["inner", Baz],
      ]);

      class DirectRecursiveMutateProperty extends SimpleModelPropertyMutation<SimpleMutationOptions> {
        mutate() {
          const alternate = alternateTypes.get(this.sourceType.name);
          if (alternate) {
            this.mutationNode.mutate((prop) => {
              prop.type = alternate;
            });
            this.type = this.engine.mutate(alternate, this.options, this.startTypeEdge());
          } else {
            super.mutate();
          }
        }
      }

      const engine = createPropertyEngine(tk, DirectRecursiveMutateProperty);

      const fooMutation = engine.mutate(Foo);
      const propMutation = fooMutation.properties.get("prop")!;

      expectModelType(propMutation.mutatedType.type, "Bar");

      const barMutation = propMutation.type;
      expect(barMutation.kind).toBe("Model");
      const innerPropMutation = (barMutation as any).properties.get("inner")!;
      expectModelType(innerPropMutation.mutatedType.type, "Baz");

      expect(Foo.properties.get("prop")!.type.kind).toBe("Scalar");
      expect(Bar.properties.get("inner")!.type.kind).toBe("Scalar");
    });
  });

  describe("ModelProperty.type via mutationInfo interceptor", () => {
    it("replacement type resolved via mutationInfo has its properties processed by the mutator", async () => {
      const { Foo, program, tk } = await compile(t.code`
        model ${t.model("Foo")} {
          prop: OriginalType;
        }

        model ${t.model("OriginalType")} {
          value: string;
        }

        model ${t.model("AlternateModel")} {
          inner: InnerOriginal;
        }

        model ${t.model("InnerAlternate")} {
          deep: string;
        }

        model ${t.model("InnerOriginal")} {
          x: int32;
        }
      `);

      const OriginalType = program.getGlobalNamespaceType().models.get("OriginalType")!;
      const AlternateModel = program.getGlobalNamespaceType().models.get("AlternateModel")!;
      const InnerOriginal = program.getGlobalNamespaceType().models.get("InnerOriginal")!;
      const InnerAlternate = program.getGlobalNamespaceType().models.get("InnerAlternate")!;

      const alternateTypeMap = new Map<Type, Type>([
        [OriginalType, AlternateModel],
        [InnerOriginal, InnerAlternate],
      ]);

      const Mutation = createMutationInfoPropertyReplacement(alternateTypeMap);
      const engine = createPropertyEngine(tk, Mutation);

      const fooMutation = engine.mutate(Foo);
      const propMutation = fooMutation.properties.get("prop")!;

      expectModelType(propMutation.mutatedType.type, "AlternateModel");

      // AlternateModel.inner should also be replaced with InnerAlternate
      const alternateMutation = propMutation.type;
      expect(alternateMutation.kind).toBe("Model");
      const innerPropMutation = (alternateMutation as any).properties.get("inner")!;
      expectModelType(innerPropMutation.mutatedType.type, "InnerAlternate");

      // Original types should be unchanged
      expectModelType(Foo.properties.get("prop")!.type, "OriginalType");
    });
  });

  describe("Operation.returnType", () => {
    it("replaces return type with a model type", async () => {
      const { myOp, Bar, tk } = await compile(t.code`
        op ${t.op("myOp")}(): string;

        model ${t.model("Bar")} {
          name: string;
        }
      `);

      class AlternateReturnType extends SimpleOperationMutation<SimpleMutationOptions> {
        protected mutateReturnType() {
          this.mutationNode.mutate((op) => {
            op.returnType = Bar;
          });
          this.returnType = this.engine.mutate(Bar, this.options, this.startReturnTypeEdge());
        }
      }

      const engine = createOperationEngine(tk, AlternateReturnType);

      const opMutation = engine.mutate(myOp as Operation);
      expectModelType(opMutation.mutatedType.returnType, "Bar");
      expect((myOp as Operation).returnType.kind).toBe("Scalar");
    });

    it("replaces return type with a type also used in parameters (shared instance)", async () => {
      const { myOp, program, tk } = await compile(t.code`
        model ${t.model("Bar")} {
          name: string;
        }

        op ${t.op("myOp")}(param: Bar): string;
      `);

      const Bar = program.getGlobalNamespaceType().models.get("Bar")!;

      class AlternateReturnType extends SimpleOperationMutation<SimpleMutationOptions> {
        protected mutateReturnType() {
          this.mutationNode.mutate((op) => {
            op.returnType = Bar;
          });
          this.returnType = this.engine.mutate(Bar, this.options, this.startReturnTypeEdge());
        }
      }

      const engine = createOperationEngine(tk, AlternateReturnType);

      const opMutation = engine.mutate(myOp as Operation);

      expectModelType(opMutation.mutatedType.returnType, "Bar");

      const paramProp = opMutation.parameters.properties.get("param")!;
      expectModelType(paramProp.mutatedType.type, "Bar");

      // Both should reference the same mutated Bar
      expectTypeEquals(
        opMutation.mutatedType.returnType as Model,
        paramProp.mutatedType.type as Model,
      );

      expect((myOp as Operation).returnType.kind).toBe("Scalar");
    });
  });

  describe("UnionVariant.type", () => {
    it("replaces variant type with a model type", async () => {
      const { MyUnion, Bar, tk } = await compile(t.code`
        union ${t.union("MyUnion")} {
          a: string;
        }

        model ${t.model("Bar")} {
          name: string;
        }
      `);

      const Mutation = createReplaceVariantMutation(() => Bar);
      const engine = createVariantEngine(tk, Mutation);

      const unionMutation = engine.mutate(MyUnion);
      const variantMutation = unionMutation.variants.get("a")!;

      expectModelType(variantMutation.mutatedType.type, "Bar");
      expect(MyUnion.variants.get("a")!.type.kind).toBe("Scalar");
    });

    it("replacement type shared across multiple variants uses same mutation instance", async () => {
      const { MyUnion, External, tk } = await compile(t.code`
        union ${t.union("MyUnion")} {
          a: string;
          b: int32;
        }

        model ${t.model("External")} {
          id: int32;
        }
      `);

      const Mutation = createReplaceVariantMutation(() => External);
      const engine = createVariantEngine(tk, Mutation);

      const unionMutation = engine.mutate(MyUnion);
      const variantA = unionMutation.variants.get("a")!;
      const variantB = unionMutation.variants.get("b")!;

      expectModelType(variantA.mutatedType.type, "External");
      expectModelType(variantB.mutatedType.type, "External");
      expectTypeEquals(variantA.mutatedType.type as Model, variantB.mutatedType.type as Model);
    });

    it("replacement type resolved via mutationInfo has its variants processed by the mutator", async () => {
      const { MyUnion, program, tk } = await compile(t.code`
        model ${t.model("AlternateModel")} {
          value: string;
        }

        union ${t.union("MyUnion")} {
          a: OriginalType;
        }

        scalar ${t.scalar("OriginalType")};
      `);

      const OriginalType = program.getGlobalNamespaceType().scalars.get("OriginalType")!;
      const AlternateModel = program.getGlobalNamespaceType().models.get("AlternateModel")!;

      const alternateTypeMap = new Map<Type, Type>([[OriginalType, AlternateModel]]);

      const Mutation = createMutationInfoVariantReplacement(alternateTypeMap);
      const engine = createVariantEngine(tk, Mutation);

      const unionMutation = engine.mutate(MyUnion);
      const variantA = unionMutation.variants.get("a")!;

      expectModelType(variantA.mutatedType.type, "AlternateModel");
      expect(MyUnion.variants.get("a")!.type.kind).toBe("Scalar");
    });
  });
});

/**
 * Regression test for the "properties missing" bug when using alternate types.
 *
 * The bug scenario: a downstream library (e.g. CDK) routes ARM and client type
 * edges independently — the ARM edge follows the original source reference while
 * the client edge should follow an alternate type (e.g. from @alternateType).
 *
 * When only a single type edge is wired to the original model, the alternate
 * model is never traversed by the mutation engine, so its properties are never
 * processed and are "missing" from the mutation graph.
 *
 * The fix is to use separate half-edges: one for the ARM path (original type)
 * and one for the client path (alternate type via replaceAndMutateReference with
 * a non-member half-edge kind such as "type-client").
 */
describe("dual-edge mutation (ARM + client paths) regression", () => {
  it("alternate model properties are accessible when using separate client half-edge", async () => {
    const { Foo, program, tk } = await compile(t.code`
      model ${t.model("Foo")} {
        prop: OriginalModel;
      }

      model ${t.model("OriginalModel")} {
        x: int32;
      }

      model ${t.model("AlternateModel")} {
        y: string;
      }
    `);

    const AlternateModel = program.getGlobalNamespaceType().models.get("AlternateModel")!;

    let capturedAlternateMutation: any | undefined;

    /**
     * Simulates the CDK's ArmPropertyCanonicalization pattern:
     * - ARM edge: follows original source reference (wire-level graph).
     * - Client edge: follows alternate type via replaceAndMutateReference,
     *   using a non-member half-edge kind ("type-client") so the engine routes
     *   directly to the alternate model instead of creating a stub member.
     */
    class DualEdgePropMutation extends SimpleModelPropertyMutation<SimpleMutationOptions> {
      mutate() {
        // ARM edge: traverse original source reference.
        this.type = this.engine.mutateReference(
          this.sourceType,
          this.options,
          this.startTypeEdge(),
        ) as any;

        // Client edge: non-member half-edge kind routes directly to AlternateModel.
        const clientHalfEdge = new MutationHalfEdge("type-client", this, (tail) => {
          capturedAlternateMutation = tail;
        });
        this.engine.replaceAndMutateReference(
          this.sourceType,
          AlternateModel,
          this.options,
          clientHalfEdge,
        );
      }
    }

    const engine = createPropertyEngine(tk, DualEdgePropMutation);
    const fooMutation = engine.mutate(Foo);
    const propMutation = fooMutation.properties.get("prop")!;

    // ARM path: property type is OriginalModel.
    expectModelType(propMutation.mutatedType.type, "OriginalModel");

    // Client path: AlternateModel's mutation was traversed and its properties are accessible.
    expect(capturedAlternateMutation).toBeDefined();
    expect(capturedAlternateMutation!.kind).toBe("Model");
    expectModelType((capturedAlternateMutation as any).mutatedType, "AlternateModel");

    const altProps = (capturedAlternateMutation as any).mutatedType.properties as Map<
      string,
      unknown
    >;
    expect(altProps.has("y")).toBe(true);
    expect(altProps.has("x")).toBe(false);
  });
});
