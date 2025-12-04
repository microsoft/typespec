import type { Program } from "@typespec/compiler";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, expect, it } from "vitest";
import { Tester } from "../../test/test-host.js";
import type { Mutation } from "./mutation.js";
import { SimpleMutationEngine, SimpleMutationOptions } from "./simple-mutation-engine.js";

let runner: TesterInstance;
beforeEach(async () => {
  runner = await Tester.createInstance();
});

function createEngine(program: Program) {
  const tk = $(program);
  return new SimpleMutationEngine(tk, {});
}

function labelComponents(components: Mutation<any, any, any, any>[][]) {
  return components.map((component) => component.map(labelMutation).sort());
}

function labelMutation(mutation: Mutation<any, any, any, any>) {
  const source = mutation.sourceType as any;
  const name = typeof source.name === "string" && source.name.length > 0 ? source.name : "";
  if (mutation.kind === "ModelProperty") {
    return `${mutation.kind}:${source?.name ?? "property"}`;
  }
  return `${mutation.kind}:${name}`;
}

function sortComponentLabels(components: string[][]) {
  return components.map((component) => component.join("|")).sort();
}

it("returns a single mutation component for cycles", async () => {
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      ${t.modelProperty("fooToBar")}: Bar;
    }

    model ${t.model("Bar")} {
      ${t.modelProperty("barToFoo")}: Foo;
    }
  `);

  const engine = createEngine(program);
  const fooMutation = engine.mutate(Foo, new SimpleMutationOptions());
  // touch the bar mutation through foo so the graph is connected
  expect(fooMutation.properties.get("fooToBar")!.type.kind).toBe("Model");

  const components = engine.getMutationStronglyConnectedComponents(fooMutation);
  expect(components).toHaveLength(1);
  expect(new Set(labelComponents(components)[0])).toEqual(
    new Set(["Model:Foo", "ModelProperty:fooToBar", "Model:Bar", "ModelProperty:barToFoo"]),
  );
});

it("reuses cached components for nested roots", async () => {
  const { Foo, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      ${t.modelProperty("fooToBar")}: Bar;
    }

    model ${t.model("Bar")} {
      ${t.modelProperty("barToBaz")}: Baz;
    }

    model ${t.model("Baz")} {}
  `);

  const engine = createEngine(program);
  const fooMutation = engine.mutate(Foo);
  const barMutation = fooMutation.properties.get("fooToBar")!.type as Mutation<any, any, any, any>;

  const fooComponents = engine.getMutationStronglyConnectedComponents(fooMutation);
  const barComponents = engine.getMutationStronglyConnectedComponents(barMutation);

  const fooLabels = labelComponents(fooComponents);

  expect(fooLabels).toEqual(
    expect.arrayContaining([
      ["Model:Foo"],
      ["ModelProperty:fooToBar"],
      ["Model:Bar"],
      ["ModelProperty:barToBaz"],
      ["Model:Baz"],
    ]),
  );

  const nestedLabels = labelComponents(barComponents);
  expect(nestedLabels).toEqual(
    expect.arrayContaining([["Model:Bar"], ["ModelProperty:barToBaz"], ["Model:Baz"]]),
  );

  for (const nested of nestedLabels) {
    expect(fooLabels).toContainEqual(nested);
  }
});

it("merges cache state when supersets are computed", async () => {
  const { Foo, Qux, program } = await runner.compile(t.code`
    model ${t.model("Foo")} {
      ${t.modelProperty("fooToBar")}: Bar;
    }

    model ${t.model("Bar")} {
      ${t.modelProperty("barToBaz")}: Baz;
    }

    model ${t.model("Baz")} {}

    model ${t.model("Qux")} {
      ${t.modelProperty("quxFoo")}: Foo;
    }
  `);

  const engine = createEngine(program);
  const fooMutation = engine.mutate(Foo);
  const quxMutation = engine.mutate(Qux);

  const fooBefore = labelComponents(engine.getMutationStronglyConnectedComponents(fooMutation));
  expect(fooBefore).toEqual(
    expect.arrayContaining([
      ["Model:Foo"],
      ["ModelProperty:fooToBar"],
      ["Model:Bar"],
      ["ModelProperty:barToBaz"],
      ["Model:Baz"],
    ]),
  );

  const quxLabels = labelComponents(engine.getMutationStronglyConnectedComponents(quxMutation));
  expect(quxLabels.flat()).toEqual(expect.arrayContaining(["Model:Qux", "Model:Foo"]));

  const fooAfter = labelComponents(engine.getMutationStronglyConnectedComponents(fooMutation));
  expect(sortComponentLabels(fooAfter)).toEqual(sortComponentLabels(fooBefore));
});
