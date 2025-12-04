import type { MemberType, Model, Union } from "@typespec/compiler";
import { expectTypeEquals, t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import type { MutationHalfEdge, MutationTraits } from "./mutation-engine.js";
import type { MutationInfo } from "./mutation.js";
import {
  SimpleIntrinsicMutation,
  SimpleModelMutation,
  SimpleModelPropertyMutation,
  SimpleMutationEngine,
  SimpleMutationOptions,
  SimpleScalarMutation,
  SimpleUnionMutation,
  type SimpleMutationOptionsInit,
} from "./simple-mutation-engine.js";

interface RenameMutationOptionsInit extends SimpleMutationOptionsInit {
  suffix: string;
}

class RenameMutationOptions extends SimpleMutationOptions {
  suffix: string;

  constructor(options: RenameMutationOptionsInit) {
    super(options);
    this.suffix = options.suffix;
  }

  get mutationKey() {
    return `${this.suffix}`;
  }

  with(options: Partial<RenameMutationOptionsInit>) {
    return new RenameMutationOptions({
      suffix: options.suffix ?? this.suffix,
    });
  }
}

class RenameModelMutation extends SimpleModelMutation<RenameMutationOptions> {
  mutate() {
    if ("name" in this.sourceType && typeof this.sourceType.name === "string") {
      this.mutationNode.mutate(
        (type) => (type.name = `${this.sourceType.name}${this.options.suffix}`),
      );
    }
    super.mutate();
  }
}

it("creates model and model property mutations", async () => {
  const runner = await Tester.createInstance();
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      ${t.modelProperty("prop")}: Bar;
    }

    model ${t.model("Bar")} {
      prop: string;
    }
  `);

  const tk = $(program);
  const engine = new SimpleMutationEngine<{ Model: RenameModelMutation }>(tk, {
    Model: RenameModelMutation,
  });

  const options = new RenameMutationOptions({ suffix: "Suf" });
  const fooMutation = engine.mutate(Foo, options);

  expect(fooMutation.mutatedType.name).toBe("FooSuf");
  expect(fooMutation.properties.size).toBe(1);

  const propMutation = fooMutation.properties.get("prop")!;
  expect(propMutation.mutatedType.model!.name).toBe("FooSuf");
  expect((propMutation.mutatedType.type as Model).name).toBe("BarSuf");
});

it("attaches to existing mutations", async () => {
  const runner = await Tester.createInstance();
  const { Foo, Bar, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      ${t.modelProperty("prop")}: Bar;
    }

    model ${t.model("Bar")} {
      prop: string;
    }
  `);

  const tk = $(program);
  const engine = new SimpleMutationEngine<{ Model: RenameModelMutation }>(tk, {
    Model: RenameModelMutation,
  });

  const barMutation = engine.mutate(Bar, new RenameMutationOptions({ suffix: "X" }));
  const fooMutation = engine.mutate(Foo, new RenameMutationOptions({ suffix: "X" }));

  expect(fooMutation.properties.get("prop")!.type === barMutation).toBe(true);
  expectTypeEquals(fooMutation.properties.get("prop")!.mutatedType.type, barMutation.mutatedType);
});

class RenameModelBasedOnReferenceMutation extends SimpleModelMutation<SimpleMutationOptions> {
  static mutationInfo(
    engine: SimpleMutationEngine<{ Model: RenameModelBasedOnReferenceMutation }>,
    sourceType: Model,
    referenceTypes: MemberType[],
    options: SimpleMutationOptions,
    halfEdge?: MutationHalfEdge,
    traits?: MutationTraits,
  ): MutationInfo {
    if (referenceTypes.length === 0) {
      return {
        mutationKey: options.mutationKey + "-no-ref",
        hasReference: false,
        isSynthetic: traits?.isSynthetic,
      };
    }
    return {
      mutationKey: options.mutationKey + "-has-ref",
      hasReference: true,
      isSynthetic: traits?.isSynthetic,
    };
  }

  mutate() {
    if (
      "name" in this.sourceType &&
      typeof this.sourceType.name === "string" &&
      this.mutationInfo.hasReference
    ) {
      this.mutationNode.mutate((type) => (type.name = `${this.sourceType.name}Reference`));
    }
    super.mutate();
  }
}

it("plumbs mutation info", async () => {
  const runner = await Tester.createInstance();
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      ${t.modelProperty("prop")}: Bar;
    }

    model ${t.model("Bar")} {
      barProp: string;
    }
  `);

  const tk = $(program);
  const engine = new SimpleMutationEngine<{ Model: RenameModelBasedOnReferenceMutation }>(tk, {
    Model: RenameModelBasedOnReferenceMutation,
  });

  const fooMutation = engine.mutate(Foo);
  const propMutation = fooMutation.properties.get("prop")!;
  const barRefMutation = propMutation.type as RenameModelBasedOnReferenceMutation;
  const barRefPropMutation = barRefMutation.properties.get("barProp")!;

  expect(fooMutation.mutatedType.name).toBe("Foo");
  expect((propMutation.mutatedType.type as Model).name).toBe("BarReference");
  expect(barRefMutation.mutatedType.name).toBe("BarReference");
  expect(barRefPropMutation.mutatedType.name).toBe("barProp");
  expect(barRefPropMutation.mutatedType.model!.name).toBe("BarReference");
});

interface UnionifyMutations {
  ModelProperty: UnionifyProperty;
}

class UnionifyProperty extends SimpleModelPropertyMutation<SimpleMutationOptions> {
  mutate() {
    if (!this.engine.$.union.is(this.sourceType.type)) {
      // turn it into this union:
      const newUnionType = this.engine.$.union.create({
        name: "DynamicUnion",
        variants: [
          this.engine.$.unionVariant.create({ type: this.sourceType.type }),
          this.engine.$.unionVariant.create({
            type: this.engine.$.builtin.string,
          }),
        ],
      });

      this.mutationNode.mutate((prop) => {
        prop.type = newUnionType;
      });

      this.type = this.engine.replaceAndMutateReference(
        this.sourceType,
        newUnionType,
        this.options,
        this.startTypeEdge(),
      );
    } else {
      super.mutate();
    }
  }
}

it("allows replacing types", async () => {
  const runner = await Tester.createInstance();
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      ${t.modelProperty("prop")}: int32;
    }
  `);

  const tk = $(program);
  const engine = new SimpleMutationEngine<UnionifyMutations>(tk, {
    ModelProperty: UnionifyProperty,
  });

  const fooMutation = engine.mutate(Foo);
  const propMutation = fooMutation.properties.get("prop")!;
  expect(propMutation.mutatedType.type.kind).toBe("Union");

  const unionNode = propMutation.type as SimpleUnionMutation<SimpleMutationOptions>;
  expect(unionNode.kind).toBe("Union");
  expect(unionNode.variants.size).toBe(2);
  const variants = [...unionNode.variants.values()];

  expect(variants[0].type.kind).toBe("Scalar");
  expectTypeEquals(
    (variants[0].type as SimpleScalarMutation<SimpleMutationOptions>).mutatedType,
    tk.builtin.int32,
  );

  expect(variants[1].type.kind).toBe("Scalar");
  expectTypeEquals(
    (variants[1].type as SimpleScalarMutation<SimpleMutationOptions>).mutatedType,
    tk.builtin.string,
  );
});

const nullableUnionCache = new WeakMap<Model, Union>();

class NullableReferencedModelMutation extends SimpleModelMutation<SimpleMutationOptions> {
  static mutationInfo(
    engine: SimpleMutationEngine<{ Model: NullableReferencedModelMutation }>,
    sourceType: Model,
    referenceTypes: MemberType[],
    options: SimpleMutationOptions,
    halfEdge?: MutationHalfEdge,
    traits?: MutationTraits,
  ) {
    if (referenceTypes.length > 0 && referenceTypes[0].kind === "ModelProperty") {
      let nullableUnion = nullableUnionCache.get(sourceType);
      if (!nullableUnion) {
        nullableUnion = engine.$.union.create({
          name: `${sourceType.name ?? "Anonymous"}NullableUnion`,
          variants: [
            engine.$.unionVariant.create({ name: "Value", type: sourceType }),
            engine.$.unionVariant.create({ name: "Null", type: engine.$.intrinsic.null }),
          ],
        });
        nullableUnionCache.set(sourceType, nullableUnion);
      }

      return engine.replaceAndMutateReference(referenceTypes[0], nullableUnion, options, halfEdge);
    }

    return super.mutationInfo(engine, sourceType, referenceTypes, options, halfEdge, traits);
  }
}

it(
  "substitutes referenced models with nullable unions",
  async () => {
    const runner = await Tester.createInstance();
    const { Foo, Bar, program } = await runner.compile(t.code`
    model ${t.model("Bar")} {
      value: string;
    }

    model ${t.model("Foo")} {
      prop: Bar;
    }
  `);

    const tk = $(program);
    const engine = new SimpleMutationEngine<{ Model: NullableReferencedModelMutation }>(tk, {
      Model: NullableReferencedModelMutation,
    });

    const barMutation = engine.mutate(Bar);

    expect(barMutation.kind).toBe("Model");
    expect(barMutation.mutatedType === Bar).toBe(true);

    const fooMutation = engine.mutate(Foo);

    expect(fooMutation.kind).toBe("Model");

    const propMutation = fooMutation.properties.get("prop")!;
    const nullableBarUnionMutation =
      propMutation.type as SimpleUnionMutation<SimpleMutationOptions>;

    expect(nullableBarUnionMutation.kind).toBe("Union");
    const unionVariants = [...nullableBarUnionMutation.variants.values()];
    expect(unionVariants).toHaveLength(2);

    const modelVariant = unionVariants[0];
    expect(modelVariant.type.kind).toBe("Model");

    const modelVariantMutation = modelVariant.type as SimpleModelMutation<SimpleMutationOptions>;
    expect(modelVariantMutation.mutatedType === Bar).toBe(true);

    const nullVariant = unionVariants[1];
    expect(nullVariant.type.kind).toBe("Intrinsic");

    const nullMutation = nullVariant.type as SimpleIntrinsicMutation<SimpleMutationOptions>;
    expect(nullMutation.mutatedType === tk.intrinsic.null).toBe(true);

    const nullableBarUnderlyingType = propMutation.mutatedType.type as Union;
    expect(nullableBarUnderlyingType.kind).toBe("Union");
    expect(nullableBarUnderlyingType.variants.size).toBe(2);
    expect(nullableBarUnderlyingType === nullableBarUnionMutation.mutatedType).toBe(true);

    const [valueUnionVariant, nullUnionVariant] = [...nullableBarUnderlyingType.variants.values()];
    expect(valueUnionVariant.name).toBe("Value");
    expect(valueUnionVariant.type.kind).toBe("Model");
    expect((valueUnionVariant.type as Model).name).toBe("Bar");
    expect(nullUnionVariant.name).toBe("Null");
    expect(nullUnionVariant.type === tk.intrinsic.null).toBe(true);
  },
  Infinity,
);
