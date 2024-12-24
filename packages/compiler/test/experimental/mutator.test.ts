import { strictEqual } from "assert";
import { beforeEach, expect, it } from "vitest";
import {
  mutateSubgraph,
  mutateSubgraphWithNamespace,
  Mutator,
  MutatorFlow,
  MutatorWithNamespace,
} from "../../src/experimental/mutators.js";
import { Model, ModelProperty, Namespace } from "../../src/index.js";
import { createTestHost } from "../../src/testing/test-host.js";
import { createTestWrapper } from "../../src/testing/test-utils.js";
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
  // Mutated namespace should not have Bar model
  expect(mutatedNs.models.has("Bar")).toBeFalsy();
  // Mutated namespace is propagated to the models
  expect(mutatedNs.models.get("Baz")!.namespace?.models.get("Bar")).toBeUndefined();
  // Original should be unchanged
  expect(Foo.models.get("Baz")!.namespace?.models.get("Bar")).toBeDefined();
  expect(Foo.models.get("Baz")!.namespace).toBe(Foo);
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
