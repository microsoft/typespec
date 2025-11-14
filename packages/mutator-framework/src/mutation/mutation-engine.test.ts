import type { Model } from "@typespec/compiler";
import { t } from "@typespec/compiler/testing";
import { $, type Typekit } from "@typespec/compiler/typekit";
import { expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import type { MutationSubgraph } from "../mutation-node/mutation-subgraph.js";
import { ModelPropertyMutation } from "./model-property.js";
import { ModelMutation } from "./model.js";
import { MutationEngine, MutationOptions } from "./mutation-engine.js";
import { SimpleMutationEngine } from "./simple-mutation-engine.js";

class RenameMutationOptions extends MutationOptions {
  prefix: string;
  suffix: string;

  constructor(prefix: string, suffix: string) {
    super();
    this.prefix = prefix;
    this.suffix = suffix;
  }

  cacheKey() {
    return `${this.prefix}-${this.suffix}`;
  }
}

class RenameMutationEngine extends MutationEngine<RenameMutationClasses> {
  constructor($: Typekit) {
    super($, {
      Model: RenameModelMutation,
    });
    this.registerSubgraph("prefix");
    this.registerSubgraph("suffix");
  }

  getPrefixSubgraph(options: RenameMutationOptions): MutationSubgraph {
    return this.getMutationSubgraph(options, "prefix");
  }

  getSuffixSubgraph(options: RenameMutationOptions): MutationSubgraph {
    return this.getMutationSubgraph(options, "suffix");
  }
}

interface RenameMutationClasses {
  Model: RenameModelMutation;
}

class RenameModelMutation extends ModelMutation<
  RenameMutationOptions,
  RenameMutationClasses,
  RenameMutationEngine
> {
  get #prefixSubgraph() {
    return this.engine.getPrefixSubgraph(this.options);
  }

  get #suffixSubgraph() {
    return this.engine.getSuffixSubgraph(this.options);
  }

  get withPrefix() {
    return this.getMutatedType(this.#prefixSubgraph);
  }

  get withSuffix() {
    return this.getMutatedType(this.#suffixSubgraph);
  }

  mutate() {
    if ("name" in this.sourceType && typeof this.sourceType.name === "string") {
      this.mutateType(
        this.#prefixSubgraph,
        (m) => (m.name = `${this.options.prefix}${this.sourceType.name}`),
      );
      this.mutateType(
        this.#suffixSubgraph,
        (m) => (m.name = `${this.sourceType.name}${this.options.suffix}`),
      );
    }

    // mutate all connected types passing on the same options
    super.mutate();
  }
}
it("creates mutations", async () => {
  const runner = await Tester.createInstance();
  const { Foo, Bar, prop, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      ${t.modelProperty("prop")}: Bar;
    }

    model ${t.model("Bar")} {
      prop: string;
    }
  `);

  const tk = $(program);
  const engine = new RenameMutationEngine(tk);
  const options = new RenameMutationOptions("Pre", "Suf");
  const fooMutation = engine.mutate(Foo, options);

  // can navigate the mutation result to get prefix and suffix names side-by-side
  expect(fooMutation.properties.size).toBe(1);

  const barMutation = fooMutation.properties.get("prop")!.type as RenameModelMutation;
  expect(barMutation.withPrefix.name).toBe("PreBar");

  // Or you could get barMutation like:
  const barMutation2 = engine.mutate(Bar, options);

  // but these are not the same mutation node because the mutation accessed via
  // the property is a distinct from the one accessed from the scalar.
  expect(barMutation === barMutation2).toBe(false);
  expect(barMutation.referenceTypes.length).toEqual(1);
  expect(barMutation.referenceTypes[0] === prop).toBe(true);
  expect(barMutation2.referenceTypes.length).toEqual(0);

  // The graph is mutated
  const prefixModel = fooMutation.withPrefix;
  const suffixModel = fooMutation.withSuffix;

  expect(prefixModel.name).toBe("PreFoo");
  expect((prefixModel.properties.get("prop")!.type as Model).name).toBe("PreBar");
  expect(suffixModel.name).toBe("FooSuf");
  expect((suffixModel.properties.get("prop")!.type as Model).name).toBe("BarSuf");
});

interface UnionifyMutations {
  Model: UnionifyModel;
  ModelProperty: UnionifyProperty;
}

class UnionifyModel extends ModelMutation<
  MutationOptions,
  UnionifyMutations,
  SimpleMutationEngine<UnionifyMutations>
> {
  get unionified() {
    return this.getMutatedType();
  }
}

class UnionifyProperty extends ModelPropertyMutation<
  MutationOptions,
  UnionifyMutations,
  SimpleMutationEngine<UnionifyMutations>
> {
  get unionified() {
    return this.getMutatedType();
  }

  mutate() {
    if (!this.engine.$.union.is(this.sourceType.type)) {
      // turn it into this union:
      const newUnionType = this.engine.$.union.create({
        variants: [
          this.engine.$.unionVariant.create({ type: this.sourceType.type }),
          this.engine.$.unionVariant.create({
            type: this.engine.$.builtin.string,
          }),
        ],
      });

      this.type = this.replaceReferencedType(
        this.engine.getDefaultMutationSubgraph(this.options),
        newUnionType,
      );
    } else {
      super.mutate();
    }
  }
}

it("mutates model properties into unions", async () => {
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
  const engine = new SimpleMutationEngine(tk, {
    ModelProperty: UnionifyProperty,
    Model: UnionifyModel,
  });

  const fooMutation = engine.mutate(Foo);
  const propMutation = fooMutation.properties.get("prop")!;
  const typeMutation = propMutation.type as UnionifyModel;
  expect(typeMutation.kind).toBe("Union");
  const propType = propMutation.unionified;
  expect(tk.union.is(propType.type)).toBe(true);

  const mutatedFoo = fooMutation.unionified;
  expect(tk.union.is(mutatedFoo.properties.get("prop")!.type)).toBe(true);
});
