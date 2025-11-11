import type { MemberType, Model } from "@typespec/compiler";
import { t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import type { MutationInfo } from "./mutation.js";
import {
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
  expect(fooMutation.properties.get("prop")!.mutatedType.type === barMutation.mutatedType).toBe(
    true,
  );
});

class RenameModelBasedOnReferenceMutation extends SimpleModelMutation<SimpleMutationOptions> {
  static mutationInfo(
    engine: SimpleMutationEngine<{ Model: RenameModelBasedOnReferenceMutation }>,
    sourceType: Model,
    referenceTypes: MemberType[],
    options: SimpleMutationOptions,
  ): MutationInfo {
    if (referenceTypes.length === 0) {
      return { mutationKey: options.mutationKey + "-no-ref", hasReference: false };
    }
    return { mutationKey: options.mutationKey + "-has-ref", hasReference: true };
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
  expect(
    (variants[0].type as SimpleScalarMutation<SimpleMutationOptions>).mutatedType ===
      tk.builtin.int32,
  ).toBe(true);

  expect(variants[1].type.kind).toBe("Scalar");
  expect(
    (variants[1].type as SimpleScalarMutation<SimpleMutationOptions>).mutatedType ===
      tk.builtin.string,
  ).toBe(true);
});
