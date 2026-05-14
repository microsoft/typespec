import { describe, expect, it } from "vitest";
import { navigateProgram } from "../../src/core/semantic-walker.js";
import {
  mutateSubgraphWithNamespace,
  MutatorWithNamespace,
} from "../../src/experimental/mutators.js";
import { Model, Namespace } from "../../src/index.js";
import { Tester } from "../tester.js";

/**
 * Smoke tests for `realm.asProgram()` — the Program-shaped facade backed by a
 * Realm. These tests validate that:
 *
 * 1. A realm produced by a namespace-rooted mutation exposes the cloned global
 *    namespace via `asProgram().getGlobalNamespaceType()`.
 * 2. `navigateProgram(realm.asProgram(), ...)` traverses the mutated tree.
 * 3. Two mutation stages can be chained: stage 2 takes stage 1's
 *    `realm.asProgram()` as input and produces its own facade.
 */
describe("realm.asProgram facade", () => {
  it("getGlobalNamespaceType returns the cloned global namespace", async () => {
    const { program } = await Tester.compile(`
      model Foo { x: string; }
      model Bar { y: string; }
    `);

    const renameMutator: MutatorWithNamespace = {
      name: "rename-foo-to-foo2",
      Namespace: { mutate: () => {} },
      Model: {
        mutate: (_model, clone) => {
          if (clone.name === "Foo") {
            clone.name = "Foo2";
          }
        },
      },
    };

    const result = mutateSubgraphWithNamespace(
      program,
      [renameMutator],
      program.getGlobalNamespaceType(),
    );

    expect(result.realm).not.toBeNull();
    const facade = result.realm!.asProgram();
    const facadeGlobal = facade.getGlobalNamespaceType();

    // The facade's global is the cloned global, not the parent's.
    expect(facadeGlobal).not.toBe(program.getGlobalNamespaceType());

    // The cloned global has the renamed model.
    expect(facadeGlobal.models.has("Foo2")).toBe(true);
    expect(facadeGlobal.models.has("Foo")).toBe(false);
    expect(facadeGlobal.models.has("Bar")).toBe(true);

    // Parent program is unchanged.
    expect(program.getGlobalNamespaceType().models.has("Foo")).toBe(true);
    expect(program.getGlobalNamespaceType().models.has("Foo2")).toBe(false);
  });

  it("navigateProgram on the facade walks the mutated tree", async () => {
    const { program } = await Tester.compile(`
      model Foo { x: string; }
      model Bar { y: string; }
    `);

    const renameMutator: MutatorWithNamespace = {
      name: "rename-foo",
      Namespace: { mutate: () => {} },
      Model: {
        mutate: (_model, clone) => {
          if (clone.name === "Foo") {
            clone.name = "RenamedFoo";
          }
        },
      },
    };

    const result = mutateSubgraphWithNamespace(
      program,
      [renameMutator],
      program.getGlobalNamespaceType(),
    );
    const facade = result.realm!.asProgram();

    const visitedNames: string[] = [];
    navigateProgram(facade, {
      model: (m: Model) => {
        // Skip compiler builtins.
        if (m.namespace?.name === "TypeSpec") return;
        visitedNames.push(m.name);
      },
    });

    expect(visitedNames).toContain("RenamedFoo");
    expect(visitedNames).toContain("Bar");
    expect(visitedNames).not.toContain("Foo");
  });

  it("chains two stages: stage 2 consumes stage 1's facade as a Program", async () => {
    const { program } = await Tester.compile(`
      model Foo { x: string; }
      model Bar { y: string; }
    `);

    // Stage 1: rename Foo -> Stage1Foo
    const stage1Mutator: MutatorWithNamespace = {
      name: "stage1",
      Namespace: { mutate: () => {} },
      Model: {
        mutate: (_model, clone) => {
          if (clone.name === "Foo") {
            clone.name = "Stage1Foo";
          }
        },
      },
    };

    const stage1 = mutateSubgraphWithNamespace(
      program,
      [stage1Mutator],
      program.getGlobalNamespaceType(),
    );
    const p1 = stage1.realm!.asProgram();

    // Verify stage 1 worked.
    expect(p1.getGlobalNamespaceType().models.has("Stage1Foo")).toBe(true);

    // Stage 2: rename Bar -> Stage2Bar, taking p1 as input.
    const stage2Mutator: MutatorWithNamespace = {
      name: "stage2",
      Namespace: { mutate: () => {} },
      Model: {
        mutate: (_model, clone) => {
          if (clone.name === "Bar") {
            clone.name = "Stage2Bar";
          }
        },
      },
    };

    const stage2 = mutateSubgraphWithNamespace(
      p1,
      [stage2Mutator],
      p1.getGlobalNamespaceType(),
    );
    const p2 = stage2.realm!.asProgram();
    const p2Global = p2.getGlobalNamespaceType();

    // Stage 2's output reflects both stage 1 and stage 2 mutations.
    expect(p2Global.models.has("Stage1Foo")).toBe(true);
    expect(p2Global.models.has("Stage2Bar")).toBe(true);
    expect(p2Global.models.has("Foo")).toBe(false);
    expect(p2Global.models.has("Bar")).toBe(false);

    // Original program is untouched.
    expect(program.getGlobalNamespaceType().models.has("Foo")).toBe(true);
    expect(program.getGlobalNamespaceType().models.has("Bar")).toBe(true);
  });

  it("falls back to parent's global namespace when realm has no cloned global", async () => {
    const { program } = await Tester.compile(`
      model Foo { x: string; }
    `);

    // Construct a Realm directly without going through the namespace-mutation
    // path. Its globalNamespace getter should be undefined and the facade must
    // fall back to the parent's global.
    const { Realm } = await import("../../src/experimental/realm.js");
    const realm = new Realm(program, "test-no-global");
    const facade = realm.asProgram();
    expect(facade.getGlobalNamespaceType()).toBe(program.getGlobalNamespaceType());
  });

  it("delegates non-overridden Program members to the parent", async () => {
    const { program } = await Tester.compile(`
      model Foo { x: string; }
    `);

    const mutator: MutatorWithNamespace = {
      name: "test",
      Namespace: { mutate: () => {} },
      Model: {
        mutate: (_, clone) => {
          if (clone.name === "Foo") clone.name = "Foo2";
        },
      },
    };

    const result = mutateSubgraphWithNamespace(
      program,
      [mutator],
      program.getGlobalNamespaceType(),
    );
    const facade = result.realm!.asProgram();

    // Pass-through to parent.
    expect(facade.compilerOptions).toBe(program.compilerOptions);
    expect(facade.host).toBe(program.host);
    expect(facade.checker).toBe(program.checker);
    expect(facade.resolver).toBe(program.resolver);
    expect(facade.sourceFiles).toBe(program.sourceFiles);
    expect(facade.projectRoot).toBe(program.projectRoot);
    expect(facade.hasError()).toBe(program.hasError());
  });
});

describe("Realm globalNamespace tracking", () => {
  it("records the cloned global namespace when mutating namespaces", async () => {
    const { program } = await Tester.compile(`
      model Foo { x: string; }
    `);

    const mutator: MutatorWithNamespace = {
      name: "test",
      Namespace: { mutate: () => {} },
      Model: {
        mutate: (_, clone) => {
          if (clone.name === "Foo") clone.name = "Foo2";
        },
      },
    };

    const result = mutateSubgraphWithNamespace(
      program,
      [mutator],
      program.getGlobalNamespaceType(),
    );

    expect(result.realm).not.toBeNull();
    const cloned = result.realm!.globalNamespace;
    expect(cloned).toBeDefined();
    expect(cloned!.kind).toBe("Namespace");
    expect((cloned as Namespace).models.has("Foo2")).toBe(true);
  });
});
