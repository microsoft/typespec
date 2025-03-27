import { strictEqual } from "assert";
import { beforeEach, describe, expect, it } from "vitest";
import {
  mutateSubgraph,
  mutateSubgraphWithNamespace,
  Mutator,
  MutatorFlow,
  MutatorWithNamespace,
} from "../../src/experimental/mutators.js";
import { Model, ModelProperty, Namespace, Operation } from "../../src/index.js";
import { createTestHost } from "../../src/testing/test-host.js";
import { createTestWrapper, expectTypeEquals } from "../../src/testing/test-utils.js";
import { BasicTestRunner, TestHost } from "../../src/testing/types.js";

let host: TestHost;
let runner: BasicTestRunner;

beforeEach(async () => {
  host = await createTestHost();
  runner = createTestWrapper(host);
});

it("works", async () => {
  const code = `
      @test model Foo {
        x: string;
        y: string;
      };
    `;

  const { Foo } = (await runner.compile(code)) as { Foo: Model };
  const mutator: Mutator = {
    name: "test",
    Model: {
      mutate: (_model, clone) => {
        clone.properties.delete("x");
      },
    },
  };
  const mutated = mutateSubgraph(runner.program, [mutator], Foo);

  const mutatedModel = mutated.type as Model;
  expect(mutated.realm?.hasType(mutatedModel)).toBeTruthy();
  expect(mutatedModel.properties.get("x")).toBeUndefined();
  expect(mutatedModel.properties.get("y")).toBeDefined();
  // checking if the original model is not mutated
  expect(Foo.properties.size).toBe(2);
  expect(Foo.properties.get("x")).toBeDefined();
  expect(Foo.properties.get("y")).toBeDefined();
});

it("recurses the model", async () => {
  const code = `
    @test model Bar {
      bar: string;
    }
    @test model Foo {
      x: string;
      y: string;
      z: Bar;
    };
  `;

  const visited: string[] = [];
  const { Foo } = (await runner.compile(code)) as { Foo: Model };
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
  mutateSubgraph(runner.program, [mutator], Foo);

  expect(visited).toStrictEqual(["Foo", "Bar"]);
});

it("propagate mutated model to model property", async () => {
  const code = `
    @test model Foo {
      a: string;
    }
    
  `;

  const visited: string[] = [];
  const { Foo } = (await runner.compile(code)) as { Foo: Model };
  const mutator: Mutator = {
    name: "test",
    Model: (_, clone) => {
      visited.push(clone.name);
    },
    ModelProperty: (_, clone) => {
      // Just to force mutation
    },
  };
  const MutatedFoo = mutateSubgraph(runner.program, [mutator], Foo).type as Model;
  expectTypeEquals(MutatedFoo.properties.get("a")!.model, MutatedFoo);
});

describe("handles circular references", () => {
  it("reference itself", async () => {
    const code = `
    @test model Foo {
      foo: Foo
    };
  `;

    const visited: string[] = [];
    const { Foo } = (await runner.compile(code)) as { Foo: Model };
    const mutator: Mutator = {
      name: "test",
      Model: {
        mutate: (clone) => {
          visited.push(clone.name);
        },
      },
    };
    mutateSubgraph(runner.program, [mutator], Foo);

    expect(visited).toStrictEqual(["Foo"]);
  });
});

// We said we didn't actually want model properties to be cloned if they are not explicitly mutated.`¡
it.skip("doesn't duplicate references", async () => {
  const code = `
    @test model Bar {
      bar: string;
    }
    @test model Baz {
      bar: Bar;
    }
    @test model Foo {
      baz: Baz;
      bar: Bar;
    };
  `;

  const visited: Model[] = [];
  const { Foo } = (await runner.compile(code)) as { Foo: Model };
  const mutator: Mutator = {
    name: "test",
    Model: {
      mutate: (_, clone) => {
        visited.push(clone);
      },
    },
  };
  mutateSubgraph(runner.program, [mutator], Foo);

  expect(visited.map((x) => x.name)).toEqual(["Foo", "Baz", "Bar"]);
  const [MutatedFoo, _MutatedBaz, MutatedBar] = visited;
  expectTypeEquals(MutatedFoo.properties.get("bar")!.type, MutatedBar);
  expectTypeEquals(
    (MutatedFoo.properties.get("baz")!.type as Model).properties.get("bar")?.type!,
    MutatedBar,
  );
});

it("doesn't duplicate references from different types", async () => {
  const code = `
    @test model Common {}
    @test op test(bar: Common): Common;
  `;

  const visited: (Model | Operation)[] = [];
  const { test } = await runner.compile(code);
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
  mutateSubgraph(runner.program, [mutator], test as any);

  expect(visited.map((x) => x.name)).toEqual(["test", "", "Common"]);
  const [MutatedTest, _, MutatedCommon] = visited;
  expectTypeEquals((MutatedTest as Operation).returnType, MutatedCommon);
});

it("removes model reference from namespace", async () => {
  const code = `
  @test namespace Foo;
  @test model Bar {
    bar: string;
  }
  @test model Baz {
    x: string;
    y: string;
    z: Bar;
  };
  `;

  const { Foo } = (await runner.compile(code)) as { Foo: Namespace; Bar: Model; Baz: Model };
  const mutator: MutatorWithNamespace = {
    name: "test",
    Namespace: {
      mutate: (_ns, clone) => {
        clone.models.delete("Bar");
      },
    },
  };

  const { type } = mutateSubgraphWithNamespace(runner.program, [mutator], Foo);

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
  const code = `
  @test namespace Foo;
  @test model Bar {}
  @test model Baz {
    z: Bar;
  };
  `;

  const visited: string[] = [];

  const { Foo } = (await runner.compile(code)) as { Foo: Namespace; Bar: Model; Baz: Model };
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

  mutateSubgraphWithNamespace(runner.program, [mutator], Foo);
  expect(visited).toEqual(["Bar", "Baz"]);
});

it("do not recurse the model", async () => {
  const code = `
    @test model Bar {
      bar: string;
    }
    @test model Foo {
      x: string;
      y: string;
      z: Bar;
    };
  `;

  const visited: string[] = [];
  const { Foo } = (await runner.compile(code)) as { Foo: Model };
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
  mutateSubgraph(runner.program, [mutator], Foo);

  expect(visited).toStrictEqual(["Foo"]);
});

it("can mutate literals", async () => {
  const { a, b, c } = (await runner.compile(`
    model Foo {
      @test a: "example";
      @test b: 42;
      @test c: false;
    }
  `)) as { a: ModelProperty; b: ModelProperty; c: ModelProperty };

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

  const mutatedA = mutateSubgraph(runner.program, [mutator], a.type).type;

  strictEqual(mutatedA.kind, "String");
  strictEqual(mutatedA.value, "example!");

  const mutatedB = mutateSubgraph(runner.program, [mutator], b.type).type;

  strictEqual(mutatedB.kind, "Number");
  strictEqual(mutatedB.value, 43);

  const mutatedC = mutateSubgraph(runner.program, [mutator], c.type).type;

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
    Union: noop,
    UnionVariant: noop,
    Enum: noop,
    Scalar: noop,
    EnumMember: noop,
    Operation: noop,
    ModelProperty: noop,
  };

  async function globalMutate(code: string): Promise<Namespace> {
    await runner.compile(code);

    const { type } = mutateSubgraphWithNamespace(
      runner.program,
      [mutator],
      runner.program.getGlobalNamespaceType(),
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
});

describe("decorators", () => {
  // Regression test for https://github.com/microsoft/typespec/issues/6655
  it("doesn't crash when mutating null value", async () => {
    const host = await createTestHost();
    const code = `
      import "./dec.js";
      extern dec myDec(target, value: valueof unknown);
      
      @myDec(null)
      @test model Foo {}
  `;
    host.addJsFile("dec.js", { $myDec: () => {} });
    host.addTypeSpecFile("main.tsp", code);

    const { Foo } = (await host.compile("main.tsp")) as { Foo: Model };
    const mutator: Mutator = {
      name: "test",
      Model: {
        mutate: (_model, clone) => {},
      },
    };
    expect(() => mutateSubgraph(host.program, [mutator], Foo)).not.toThrow();
  });
});
