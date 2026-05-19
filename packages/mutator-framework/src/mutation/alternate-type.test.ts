import type { MemberType, Model, ModelProperty, Operation, Type, UnionVariant } from "@typespec/compiler";
import { expectTypeEquals, t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import type { Typekit } from "@typespec/compiler/typekit";
import { describe, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import type { MutationHalfEdge, MutationTraits } from "./mutation-engine.js";
import type { MutationInfo } from "./mutation.js";
import {
  SimpleModelPropertyMutation,
  SimpleMutationEngine,
  SimpleMutationOptions,
  SimpleOperationMutation,
  SimpleUnionVariantMutation,
} from "./simple-mutation-engine.js";

// --- Helpers ---

async function compile(code: ReturnType<typeof t.code>) {
  const runner = await Tester.createInstance();
  const result = await runner.compile(code);
  return { ...result, tk: $(result.program) };
}

function createPropertyEngine(
  tk: Typekit,
  MutationClass: typeof SimpleModelPropertyMutation<SimpleMutationOptions>,
) {
  return new SimpleMutationEngine<{ ModelProperty: typeof MutationClass }>(tk, {
    ModelProperty: MutationClass,
  } as any);
}

function createOperationEngine(
  tk: Typekit,
  MutationClass: typeof SimpleOperationMutation<SimpleMutationOptions>,
) {
  return new SimpleMutationEngine<{ Operation: typeof MutationClass }>(tk, {
    Operation: MutationClass,
  } as any);
}

function createVariantEngine(
  tk: Typekit,
  MutationClass: typeof SimpleUnionVariantMutation<SimpleMutationOptions>,
) {
  return new SimpleMutationEngine<{ UnionVariant: typeof MutationClass }>(tk, {
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

function expectModelType(type: Type, name: string) {
  expect(type.kind).toBe("Model");
  expect((type as Model).name).toBe(name);
}

/**
 * These tests replicate the behavior of a downstream library's `@alternateType` decorator
 * which replaces the type of a property/returnType/variant with a different type during mutation.
 * The pattern is general: it's not specific to model properties but applies to any type reference
 * (Operation.returnType, UnionVariant.type, etc.)
 *
 * Tests cover two approaches:
 * 1. Using the mutation node's mutate + replaceAndMutateReference (full control)
 * 2. Simply mutating the node's type (simpler approach that should also work)
 */
describe("type replacement (@alternateType pattern)", () => {
  describe("ModelProperty.type", () => {
    it("replaces property type with a model type via mutationNode.mutate", async () => {
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

    it("replaces property type without replaceAndMutateReference (stub type on node)", async () => {
      const { Foo, Bar, tk } = await compile(t.code`
        model ${t.model("Foo")} {
          prop: string;
        }

        model ${t.model("Bar")} {
          name: string;
        }
      `);

      // Simpler approach: just mutate the node's type directly without replaceAndMutateReference
      class SimpleAlternateTypeProperty extends SimpleModelPropertyMutation<SimpleMutationOptions> {
        mutate() {
          this.mutationNode.mutate((prop) => {
            prop.type = Bar;
          });
          this.type = this.engine.mutate(Bar, this.options, this.startTypeEdge());
        }
      }

      const engine = createPropertyEngine(tk, SimpleAlternateTypeProperty);

      const fooMutation = engine.mutate(Foo);
      const propMutation = fooMutation.properties.get("prop")!;

      expectModelType(propMutation.mutatedType.type, "Bar");
      expect(Foo.properties.get("prop")!.type.kind).toBe("Scalar");
    });

    it("replacement type that is also mutated in the graph shares the same instance", async () => {
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

    it("replaces property type with an external type not in the original subgraph", async () => {
      const { Foo, External, tk } = await compile(t.code`
        model ${t.model("Foo")} {
          prop: string;
        }

        model ${t.model("External")} {
          id: int32;
        }
      `);

      const Mutation = createReplacePropertyMutation(() => External);
      const engine = createPropertyEngine(tk, Mutation);

      const fooMutation = engine.mutate(Foo);
      const propMutation = fooMutation.properties.get("prop")!;

      expectModelType(propMutation.mutatedType.type, "External");
      expect(Foo.properties.get("prop")!.type.kind).toBe("Scalar");
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

    it("recursively processes replacement type using engine.mutate (without replaceAndMutateReference)", async () => {
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

      // This version uses engine.mutate directly instead of replaceAndMutateReference
      class SimpleRecursiveAlternateType extends SimpleModelPropertyMutation<SimpleMutationOptions> {
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

      const engine = createPropertyEngine(tk, SimpleRecursiveAlternateType);

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

    // This test exposes a bug: when `replaceAndMutateReference` is called from
    // `mutationInfo` of a ModelProperty mutation, the parent Model's property edge
    // expects a ModelPropertyMutationNode as its tail (to call `connectModel`), but
    // the replacement creates a mutation for the alternate type (e.g., a ModelMutation)
    // which doesn't satisfy that interface. The framework should handle this case
    // so that `@alternateType`-style interceptors can work at the ModelProperty level.
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

      const alternateTypeMap = new Map<Model, Model>([
        [OriginalType, AlternateModel],
        [InnerOriginal, InnerAlternate],
      ]);

      class AlternateTypePropertyViaInfo extends SimpleModelPropertyMutation<SimpleMutationOptions> {
        static mutationInfo(
          engine: SimpleMutationEngine<{ ModelProperty: AlternateTypePropertyViaInfo }>,
          sourceType: ModelProperty,
          referenceTypes: MemberType[],
          options: SimpleMutationOptions,
          halfEdge?: MutationHalfEdge,
          traits?: MutationTraits,
        ): MutationInfo | AlternateTypePropertyViaInfo {
          let referencedType = sourceType.type;
          while (referencedType.kind === "ModelProperty" || referencedType.kind === "UnionVariant") {
            referencedType = (referencedType as any).type;
          }

          const alternate = alternateTypeMap.get(referencedType as Model);
          if (alternate) {
            return engine.replaceAndMutateReference(
              sourceType,
              alternate,
              options,
              halfEdge,
            ) as any;
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
      }

      const engine = createPropertyEngine(tk, AlternateTypePropertyViaInfo);

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

    it("replaces variant type with an external type (shared across variants)", async () => {
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

      expect(MyUnion.variants.get("a")!.type.kind).toBe("Scalar");
      expect(MyUnion.variants.get("b")!.type.kind).toBe("Scalar");
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

      class AlternateTypeVariantViaInfo extends SimpleUnionVariantMutation<SimpleMutationOptions> {
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
            return engine.replaceAndMutateReference(
              sourceType,
              alternate,
              options,
              halfEdge,
            ) as any;
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
      }

      const engine = createVariantEngine(tk, AlternateTypeVariantViaInfo);

      const unionMutation = engine.mutate(MyUnion);
      const variantA = unionMutation.variants.get("a")!;

      expectModelType(variantA.mutatedType.type, "AlternateModel");
      expect(MyUnion.variants.get("a")!.type.kind).toBe("Scalar");
    });
  });
});
