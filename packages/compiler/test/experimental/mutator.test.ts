import { strictEqual } from "assert";
import { assert, describe, expect, it } from "vitest";
import type { Mutator, MutatorWithNamespace } from "../../src/experimental/mutators.js";
import {
  mutateSubgraph,
  mutateSubgraphWithNamespace,
  MutatorFlow,
} from "../../src/experimental/mutators.js";
import type { Model, ModelProperty, Namespace, Operation } from "../../src/index.js";
import { mockFile, t } from "../../src/testing/index.js";
import { expectTypeEquals } from "../../src/testing/test-utils.js";
import { Tester } from "../tester.js";

it("works", async () => {
  const { Foo, program } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        x: string;
        y: string;
      };
    `);
  const mutator: Mutator = {
    name: "test",
    Model: {
      mutate: (_model, clone) => {
        clone.properties.delete("x");
      },
    },
  };
  const mutated = mutateSubgraph(program, [mutator], Foo);

  const mutatedModel = mutated.type as Model;
  expect(mutated.realm?.hasType(mutatedModel)).toBeTruthy();
  expect(mutatedModel.properties.get("x")).toBeUndefined();
  expect(mutatedModel.properties.get("y")).toBeDefined();
  // checking if the original model is not mutated
  expect(Foo.properties.size).toBe(2);
  expect(Foo.properties.get("x")).toBeDefined();
  expect(Foo.properties.get("y")).toBeDefined();
});

it("reuses cached clones across top-level calls within a program", async () => {
  // The `seen` cache is scoped per Program (rather than cleared after each
  // mutation), so repeated mutations of the same type with the same mutator
  // reuse the earlier clone instead of producing a fresh one. This preserves
  // clone identity across the many overlapping subgraphs an emitter mutates.
  const { Foo, program } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        x: string;
      };
    `);
  const mutator: Mutator = {
    name: "test",
    Model: {
      mutate: (_model, clone) => {
        clone.properties.delete("x");
      },
    },
  };

  const first = mutateSubgraph(program, [mutator], Foo);
  const second = mutateSubgraph(program, [mutator], Foo);

  // The second call hits the program-scoped cache and returns the same clone.
  expect(first.type).toBe(second.type);
});

it("scopes the mutation cache per program", async () => {
  // The cache is keyed on the Program, so mutating equivalent types compiled in
  // separate programs never returns a clone belonging to the other program.
  const mutator: Mutator = {
    name: "test",
    Model: {
      mutate: (_model, clone) => {
        clone.properties.delete("x");
      },
    },
  };
  const source = t.code`
      model ${t.model("Foo")} {
        x: string;
      };
    `;

  const a = await Tester.compile(source);
  const b = await Tester.compile(source);

  const mutatedA = mutateSubgraph(a.program, [mutator], a.Foo);
  const mutatedB = mutateSubgraph(b.program, [mutator], b.Foo);

  expect(mutatedA.type).not.toBe(mutatedB.type);
  expect(mutatedA.realm?.hasType(mutatedA.type as Model)).toBeTruthy();
  expect(mutatedB.realm?.hasType(mutatedB.type as Model)).toBeTruthy();
  expect(mutatedA.realm?.hasType(mutatedB.type as Model)).toBeFalsy();
});

it("breaks cycles across re-entrant mutateSubgraph calls", async () => {
  // Mutators (e.g. @typespec/http's merge-patch transform) sometimes call
  // mutateSubgraph recursively from inside their own `mutate` function, which
  // spins up a fresh engine per call. With a self-referential model this only
  // terminates if the `seen` cache is shared across those nested engines; a
  // narrowly-scoped (per-engine) cache would recurse forever and overflow the
  // stack.
  const { Foo, program } = await Tester.compile(t.code`
      model ${t.model("Foo")} {
        self?: Foo;
      };
    `);

  const reentrant: Mutator = {
    name: "reentrant",
    Model: {
      mutate: (model, clone, innerProgram) => {
        for (const [key, prop] of model.properties) {
          const mutated = mutateSubgraph(innerProgram, [reentrant], prop);
          clone.properties.set(key, mutated.type as ModelProperty);
        }
      },
    },
  };

  expect(() => mutateSubgraph(program, [reentrant], Foo)).not.toThrow();
});

it("recurses the model", async () => {
  const visited: string[] = [];
  const { Foo, program } = await Tester.compile(t.code`
    model Bar {
      bar: string;
    }
    model ${t.model("Foo")} {
      x: string;
      y: string;
      z: Bar;
    };
  `);
  const mutator: Mutator = {
    name: "test",
    Model: {
      filter: () => {
        return MutatorFlow.MutateAndRecur;
      },
      mutate: (clone) => {
        visited.push(clone.name);
      },
    },
  };
  mutateSubgraph(program, [mutator], Foo);

  expect(visited).toStrictEqual(["Foo", "Bar"]);
});

it("propagate mutated model to model property", async () => {
  const visited: string[] = [];
  const { Foo, program } = await Tester.compile(t.code`
    model ${t.model("Foo")} {
      a: string;
    }
    
  `);
  const mutator: Mutator = {
    name: "test",
    Model: (_, clone) => {
      visited.push(clone.name);
    },
    ModelProperty: (_, clone) => {
      // Just to force mutation
    },
  };
  const MutatedFoo = mutateSubgraph(program, [mutator], Foo).type as Model;
  expectTypeEquals(MutatedFoo.properties.get("a")!.model, MutatedFoo);
});

describe("handles circular references", () => {
  it("reference itself", async () => {
    const visited: string[] = [];
    const { Foo, program } = await Tester.compile(t.code`
    model ${t.model("Foo")} {
      foo: Foo
    };
  `);
    const mutator: Mutator = {
      name: "test",
      Model: {
        mutate: (clone) => {
          visited.push(clone.name);
        },
      },
    };
    mutateSubgraph(program, [mutator], Foo);

    expect(visited).toStrictEqual(["Foo"]);
  });
});

// We said we didn't actually want model properties to be cloned if they are not explicitly mutated.`¡
it.skip("doesn't duplicate references", async () => {
  const visited: Model[] = [];
  const { Foo, program } = await Tester.compile(t.code`
    model Bar {
      bar: string;
    }
    model Baz {
      bar: Bar;
    }
    model ${t.model("Foo")} {
      baz: Baz;
      bar: Bar;
    };
  `);
  const mutator: Mutator = {
    name: "test",
    Model: {
      mutate: (_, clone) => {
        visited.push(clone);
      },
    },
  };
  mutateSubgraph(program, [mutator], Foo);

  expect(visited.map((x) => x.name)).toEqual(["Foo", "Baz", "Bar"]);
  const [MutatedFoo, _MutatedBaz, MutatedBar] = visited;
  expectTypeEquals(MutatedFoo.properties.get("bar")!.type, MutatedBar);
  expectTypeEquals(
    (MutatedFoo.properties.get("baz")!.type as Model).properties.get("bar")?.type!,
    MutatedBar,
  );
});

it("doesn't duplicate references from different types", async () => {
  const visited: (Model | Operation)[] = [];
  const { test, program } = await Tester.compile(t.code`
    model Common {}
    op ${t.op("test")}(bar: Common): Common;
  `);
  const mutator: Mutator = {
    name: "test",
    Operation: {
      mutate: (_, clone) => {
        visited.push(clone);
      },
    },
    Model: {
      mutate: (_, clone) => {
        visited.push(clone);
      },
    },
  };
  mutateSubgraph(program, [mutator], test as any);

  expect(visited.map((x) => x.name)).toEqual(["test", "", "Common"]);
  const [MutatedTest, _, MutatedCommon] = visited;
  expectTypeEquals((MutatedTest as Operation).returnType, MutatedCommon);
});

it("removes model reference from namespace", async () => {
  const { Foo, program } = await Tester.compile(t.code`
  namespace ${t.namespace("Foo")};
  model Bar {
    bar: string;
  }
  model Baz {
    x: string;
    y: string;
    z: Bar;
  };
  `);
  const mutator: MutatorWithNamespace = {
    name: "test",
    Namespace: {
      mutate: (_ns, clone) => {
        clone.models.delete("Bar");
      },
    },
  };

  const { type } = mutateSubgraphWithNamespace(program, [mutator], Foo);

  const mutatedNs = type as Namespace;

  //Original namespace should have Bar model
  expect(Foo.models.has("Bar")).toBeTruthy();
  expectTypeEquals(Foo.models.get("Baz")!.namespace!, Foo);
  // Mutated namespace should not have Bar model
  expect(mutatedNs.models.has("Bar")).toBeFalsy();
  // Mutated namespace is propagated to the models
  expectTypeEquals(mutatedNs, mutatedNs.models.get("Baz")!.namespace!);
  expect(mutatedNs.models.get("Baz")!.namespace?.models.get("Bar")).toBeUndefined();
  // Original should be unchanged
  expect(Foo.models.get("Baz")!.namespace?.models.get("Bar")).toBeDefined();
  expect(Foo.models.get("Baz")!.namespace).toBe(Foo);
});

it("doesn't mutate the same type twice when mutating namespace", async () => {
  const visited: string[] = [];

  const { Foo, program } = await Tester.compile(t.code`
  namespace ${t.namespace("Foo")};
  model Bar {}
  model Baz {
    z: Bar;
  };
  `);
  const mutator: MutatorWithNamespace = {
    name: "test",
    Namespace: {
      mutate: (_ns, clone) => {},
    },
    Model: {
      mutate: (model, clone) => {
        visited.push(clone.name);
      },
    },
  };

  mutateSubgraphWithNamespace(program, [mutator], Foo);
  expect(visited).toEqual(["Bar", "Baz"]);
});

it("do not recurse the model", async () => {
  const visited: string[] = [];
  const { Foo, program } = await Tester.compile(t.code`
    model Bar {
      bar: string;
    }
    model ${t.model("Foo")} {
      x: string;
      y: string;
      z: Bar;
    };
  `);
  const mutator: Mutator = {
    name: "test",
    Model: {
      filter: () => {
        return MutatorFlow.DoNotRecur;
      },
      mutate: (clone) => {
        visited.push(clone.name);
      },
    },
  };
  mutateSubgraph(program, [mutator], Foo);

  expect(visited).toStrictEqual(["Foo"]);
});

it("can mutate literals", async () => {
  const { a, b, c, program } = await Tester.compile(t.code`
    model Foo {
      ${t.modelProperty("a")}: "example";
      ${t.modelProperty("b")}: 42;
      ${t.modelProperty("c")}: false;
    }
  `);

  const mutator: Mutator = {
    name: "test",
    String: (str, clone) => {
      clone.value = str.value + "!";
    },
    Number: (num, clone) => {
      clone.value = num.value + 1;
    },
    Boolean: (bool, clone) => {
      clone.value = !bool.value;
    },
  };

  strictEqual(a.type.kind, "String");
  strictEqual(b.type.kind, "Number");
  strictEqual(c.type.kind, "Boolean");

  const mutatedA = mutateSubgraph(program, [mutator], a.type).type;

  strictEqual(mutatedA.kind, "String");
  strictEqual(mutatedA.value, "example!");

  const mutatedB = mutateSubgraph(program, [mutator], b.type).type;

  strictEqual(mutatedB.kind, "Number");
  strictEqual(mutatedB.value, 43);

  const mutatedC = mutateSubgraph(program, [mutator], c.type).type;

  strictEqual(mutatedC.kind, "Boolean");
  strictEqual(mutatedC.value, true);
});

// When mutating everything verify all reference between types are kept in the new realm.
describe("global graph mutation", () => {
  const noop = { mutate: () => {} };
  const mutator: MutatorWithNamespace = {
    name: "test",
    Namespace: noop,
    Interface: noop,
    Model: noop,
    Tuple: noop,
    Union: noop,
    UnionVariant: noop,
    Enum: noop,
    Scalar: noop,
    EnumMember: noop,
    Operation: noop,
    ModelProperty: noop,
  };

  async function globalMutate(code: string): Promise<Namespace> {
    const { program } = await Tester.compile(code, {
      compilerOptions: {
        configFile: {
          projectRoot: ".",
          kind: "project",
          features: ["union-extends"],
          diagnostics: [],
          outputDir: "tsp-output",
        },
      },
    });

    const { type } = mutateSubgraphWithNamespace(
      program,
      [mutator],
      program.getGlobalNamespaceType(),
    );
    strictEqual(type.kind, "Namespace");

    return type;
  }
  it("mutate sourceProperty", async () => {
    const type = await globalMutate(`
      model Spread {
        prop: string;
      }
      model Foo { ...Spread };
    `);

    const MutatedSpread = type.models.get("Spread")!;
    const MutatedFoo = type.models.get("Foo")!;
    expectTypeEquals(
      MutatedFoo.properties.get("prop")?.sourceProperty,
      MutatedSpread.properties.get("prop")!,
    );
    expectTypeEquals(MutatedFoo.sourceModels[0].model, MutatedSpread);
  });

  it("mutate sourceProperty and sourceModels in operation", async () => {
    const type = await globalMutate(`
      model Spread {
        prop: string;
      }
      op foo(...Spread): void;
    `);

    const MutatedSpread = type.models.get("Spread")!;
    const MutatedFoo = type.operations.get("foo")!;
    expectTypeEquals(
      MutatedFoo.parameters.properties.get("prop")?.sourceProperty,
      MutatedSpread.properties.get("prop")!,
    );
    expectTypeEquals(MutatedFoo.parameters.sourceModels[0].model, MutatedSpread);
  });

  it("mutate property reference", async () => {
    const type = await globalMutate(`
      model A {
        prop: string;
      }
      model B { bar: A.prop; };
    `);

    const MutatedA = type.models.get("A")!;
    const MutatedB = type.models.get("B")!;
    expectTypeEquals(MutatedA.properties.get("prop"), MutatedB.properties.get("bar")!.type);
  });

  it("mutate property reference in tuple", async () => {
    const type = await globalMutate(`
      model A {
        prop: string;
      }
      model B { bar: [A.prop]; };
    `);

    const MutatedA = type.models.get("A")!;
    const MutatedB = type.models.get("B")!;
    const barProp: any = MutatedB.properties.get("bar");
    expectTypeEquals(MutatedA.properties.get("prop"), barProp.type.values[0]);
  });

  it("mutate in tuple", async () => {
    const type = await globalMutate(`
      model A {
        prop: string;
      }
      model B { bar: [A]; };
    `);

    const MutatedA = type.models.get("A")!;
    const MutatedB = type.models.get("B")!;
    const barProp: any = MutatedB.properties.get("bar");
    expectTypeEquals(MutatedA, barProp.type.values[0]);
  });

  it("mutate union base type", async () => {
    const type = await globalMutate(`
      model PetBase { name: string }
      model Cat extends PetBase { toy: string }
      union Pet extends PetBase { cat: Cat };
    `);

    const MutatedPetBase = type.models.get("PetBase")!;
    const MutatedPet = type.unions.get("Pet")!;
    expectTypeEquals(MutatedPet.baseType!, MutatedPetBase);
  });
});

describe("decorators", () => {
  it("mutates arguments values", async () => {
    const visited: string[] = [];

    const { Foo, program } = await Tester.files({
      "dec.js": mockFile.js({ $myDec: () => {} }),
    }).import("./dec.js").compile(t.code`
      extern dec myDec(target, value: valueof unknown);
      
      enum E {
        a: "a"
      }
      
      @myDec(#{
        enumValue: E.a,
      })
      model ${t.model("Foo")} {}
  `);
    const mutator: Mutator = {
      name: "test",
      Enum: {
        mutate: (_enum, clone) => {
          visited.push(clone.name);
        },
      },
      EnumMember: {
        mutate: (_enumMember, clone) => {
          visited.push(clone.name);
        },
      },
      Model: {
        mutate: (_model, clone) => {
          visited.push(clone.name);
        },
      },
    };

    mutateSubgraph(program, [mutator], Foo);
    expect(visited).toStrictEqual(["Foo", "a", "E"]);
  });

  // Regression test for https://github.com/microsoft/typespec/issues/9318
  it("doesn't crash when mutating numeric value", async () => {
    const { prop, program } = await Tester.compile(t.code`
      model Test {
        @minValue(123)
        ${t.modelProperty("prop")}: int32;
      }
    `);
    const mutator: Mutator = {
      name: "test",
      ModelProperty: { mutate: (_, clone) => {} },
    };
    expect(() => mutateSubgraph(program, [mutator], prop)).not.toThrow();
  });

  // Regression test for https://github.com/microsoft/typespec/issues/6655
  it("doesn't crash when mutating null value", async () => {
    const { Foo, program } = await Tester.files({
      "dec.js": mockFile.js({ $myDec: () => {} }),
    }).import("./dec.js").compile(t.code`
      extern dec myDec(target, value: valueof unknown);
      
      @myDec(null)
      model ${t.model("Foo")} {}
  `);
    const mutator: Mutator = {
      name: "test",
      Model: {
        mutate: (_model, clone) => {},
      },
    };
    expect(() => mutateSubgraph(program, [mutator], Foo)).not.toThrow();
  });
});

describe("type references", () => {
  it.each([true, false])(
    "maps typed property defaults when mutating the owner: %s",
    async (mutateOwner) => {
      const { Foo, program } = await Tester.compile(t.code`
        model Item {}
        model ${t.model("Foo")} { itemType: TypeRef<Item> = typeref(Item); }
      `);
      const mutator: Mutator = {
        name: "test",
        Model: {
          filter: (model) => mutateOwner || model.name === "Item",
          mutate: (_original, clone) => {
            if (clone.name === "Item") clone.name = "MutatedItem";
          },
        },
      };
      const { type } = mutateSubgraph(program, [mutator], Foo);
      assert(type.kind === "Model");
      const original = Foo.properties.get("itemType")!.defaultValue;
      const property = type.properties.get("itemType")!;
      const mutated = property.defaultValue;
      assert(original?.valueKind === "TypeRefValue");
      assert(mutated?.valueKind === "TypeRefValue");
      expect(original.target).toMatchObject({ kind: "Model", name: "Item" });
      expect(mutated.target).toMatchObject({ kind: "Model", name: "MutatedItem" });
      expect(mutated.target).not.toBe(original.target);
      expect(mutated.type).toBe(property.type);
      assert(mutated.type.kind === "Scalar");
      expect(mutated.type.templateMapper?.args[0]).toBe(mutated.target);
      assert(original.type.kind === "Scalar");
      expect(original.type.templateMapper?.args[0]).toBe(original.target);
    },
  );

  it("maps type references in scalar constructor arguments to the mutated targets", async () => {
    const { Foo, program } = await Tester.compile(t.code`
      model Item {}
      scalar Registration { init fromType(reference: TypeRef); }
      model ${t.model("Foo")} {
        registration: Registration = Registration.fromType(typeref(Item));
      }
    `);
    const mutator: Mutator = {
      name: "test",
      Model: (_, clone) => {
        if (clone.name === "Item") clone.name = "MutatedItem";
      },
      ModelProperty: () => {},
      Scalar: (_, clone) => {
        if (clone.name === "Registration") clone.name = "MutatedRegistration";
      },
    };
    const { type } = mutateSubgraph(program, [mutator], Foo);
    assert(type.kind === "Model");
    const original = Foo.properties.get("registration")!.defaultValue;
    const property = type.properties.get("registration")!;
    const mutated = property.defaultValue;
    assert(original?.valueKind === "ScalarValue");
    assert(mutated?.valueKind === "ScalarValue");
    const originalRef = original.value.args[0];
    const mutatedRef = mutated.value.args[0];
    assert(originalRef.valueKind === "TypeRefValue");
    assert(mutatedRef.valueKind === "TypeRefValue");
    expect(originalRef.target).toMatchObject({ kind: "Model", name: "Item" });
    expect(mutatedRef.target).toMatchObject({ kind: "Model", name: "MutatedItem" });
    expect(mutatedRef.target).not.toBe(originalRef.target);
    expect(mutated.type).toBe(property.type);
    expect(mutated.scalar).toBe(property.type);
    expect(mutated.scalar.name).toEqual("MutatedRegistration");
    expect(original.scalar.name).toEqual("Registration");
  });

  it("maps type references in template arguments to the mutated targets", async () => {
    const { Foo, program } = await Tester.compile(t.code`
      model Item {}
      model Ref<T extends valueof TypeRef> { ref: TypeRef = T; }
      model ${t.model("Foo")} { registration: Ref<typeref(Item)>; }
    `);
    const mutator: Mutator = {
      name: "test",
      Model: (_, clone) => {
        if (clone.name === "Item") clone.name = "MutatedItem";
      },
      ModelProperty: () => {},
    };
    const { type } = mutateSubgraph(program, [mutator], Foo);
    assert(type.kind === "Model");
    const original = Foo.properties.get("registration")!.type;
    const mutated = type.properties.get("registration")!.type;
    assert(original.kind === "Model" && original.templateMapper);
    assert(mutated.kind === "Model" && mutated.templateMapper);
    const originalRef = original.templateMapper.args[0];
    const mutatedRef = mutated.templateMapper.args[0];
    assert(originalRef.entityKind === "Value" && originalRef.valueKind === "TypeRefValue");
    assert(mutatedRef.entityKind === "Value" && mutatedRef.valueKind === "TypeRefValue");
    expect(originalRef.target).toMatchObject({ kind: "Model", name: "Item" });
    expect(mutatedRef.target).toMatchObject({ kind: "Model", name: "MutatedItem" });
    expect(mutatedRef.target).not.toBe(originalRef.target);
    const defaultValue = mutated.properties.get("ref")!.defaultValue;
    assert(defaultValue?.valueKind === "TypeRefValue");
    expect(mutatedRef.target).toBe(defaultValue.target);
    const [parameter, mapped] = [...mutated.templateMapper.map][0];
    assert(mapped.entityKind === "Value" && mapped.valueKind === "TypeRefValue");
    expect(mapped.target).toBe(mutatedRef.target);
    expect(mutated.templateMapper.getMappedType(parameter)).toBe(mapped);
  });

  it("maps type references in lazily cloned template arguments", async () => {
    const { Foo, program } = await Tester.compile(t.code`
      model Item {}
      model Ref<T extends valueof TypeRef> {}
      model ${t.model("Foo")} { registration: Ref<typeref(Item)>; }
    `);
    const original = Foo.properties.get("registration")!.type;
    assert(original.kind === "Model" && original.templateMapper);
    const mutator: Mutator = {
      name: "test",
      Model: {
        filter: (model) => model.name === "Item",
        mutate: (_, clone) => {
          clone.name = "MutatedItem";
        },
      },
    };
    const { type } = mutateSubgraph(program, [mutator], original);
    assert(type.kind === "Model" && type.templateMapper);
    const originalRef = original.templateMapper.args[0];
    const mutatedRef = type.templateMapper.args[0];
    assert(originalRef.entityKind === "Value" && originalRef.valueKind === "TypeRefValue");
    assert(mutatedRef.entityKind === "Value" && mutatedRef.valueKind === "TypeRefValue");
    expect(originalRef.target).toMatchObject({ kind: "Model", name: "Item" });
    expect(mutatedRef.target).toMatchObject({ kind: "Model", name: "MutatedItem" });
    expect(type).not.toBe(original);
    expect(mutatedRef.target).not.toBe(originalRef.target);
    const [parameter, mapped] = [...type.templateMapper.map][0];
    assert(mapped.entityKind === "Value" && mapped.valueKind === "TypeRefValue");
    expect(mapped.target).toBe(mutatedRef.target);
    expect(type.templateMapper.getMappedType(parameter)).toBe(mapped);
  });

  it("maps nested type references to the mutated targets", async () => {
    const { Foo, program } = await Tester.files({
      "dec.js": mockFile.js({ $myDec: () => {} }),
    }).import("./dec.js").compile(t.code`
      extern dec myDec(target, value: valueof { primary: TypeRef; alternatives: TypeRef[]; });
      model Item {}
      @myDec(#{ primary: typeref(Item), alternatives: #[typeref(Item)] })
      model ${t.model("Foo")} {}
    `);
    const mutator: Mutator = {
      name: "test",
      Model: {
        mutate: (_original, clone) => {
          if (clone.name === "Item") clone.name = "MutatedItem";
        },
      },
    };
    const { type } = mutateSubgraph(program, [mutator], Foo);
    assert(type.kind === "Model");
    const original = Foo.decorators[0].args[0].value;
    const mutated = type.decorators[0].args[0].value;
    assert(original.entityKind === "Value" && original.valueKind === "ObjectValue");
    assert(mutated.entityKind === "Value" && mutated.valueKind === "ObjectValue");
    const originalRef = original.properties.get("primary")!.value;
    const mutatedRef = mutated.properties.get("primary")!.value;
    assert(originalRef.valueKind === "TypeRefValue");
    assert(mutatedRef.valueKind === "TypeRefValue");
    expect(mutatedRef.target).toMatchObject({ kind: "Model", name: "MutatedItem" });
    expect(mutatedRef.target).not.toBe(originalRef.target);
    const alternatives = mutated.properties.get("alternatives")!.value;
    assert(alternatives.valueKind === "ArrayValue");
    const alternative = alternatives.values[0];
    assert(alternative.valueKind === "TypeRefValue");
    expect(alternative.target).toBe(mutatedRef.target);
  });

  it("maps type references in decorators on lazily cloned models", async () => {
    const { Foo, program } = await Tester.files({
      "dec.js": mockFile.js({ $myDec: () => {} }),
    }).import("./dec.js").compile(t.code`
      extern dec myDec(target, value: valueof TypeRef);
      model Item {}
      @myDec(typeref(Item))
      model ${t.model("Foo")} {}
    `);
    const mutator: Mutator = {
      name: "test",
      Model: {
        filter: (model) => model.name === "Item",
        mutate: (_, clone) => {
          clone.name = "MutatedItem";
        },
      },
    };
    const { type } = mutateSubgraph(program, [mutator], Foo);
    assert(type.kind === "Model");
    const original = Foo.decorators[0].args[0].value;
    const mutated = type.decorators[0].args[0].value;
    assert(original.entityKind === "Value" && original.valueKind === "TypeRefValue");
    assert(mutated.entityKind === "Value" && mutated.valueKind === "TypeRefValue");
    expect(original.target).toMatchObject({ kind: "Model", name: "Item" });
    expect(mutated.target).toMatchObject({ kind: "Model", name: "MutatedItem" });
    expect(type).not.toBe(Foo);
    expect(mutated.target).not.toBe(original.target);
    const jsValue = type.decorators[0].args[0].jsValue;
    assert(jsValue !== null && typeof jsValue === "object" && "target" in jsValue);
    expect(jsValue.target).toBe(mutated.target);
  });
});
