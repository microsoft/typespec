import type { Namespace, Type } from "@typespec/compiler";
import { unsafe_mutateSubgraphWithNamespace } from "@typespec/compiler/experimental";
import { strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { getVersioningMutators } from "../../src/mutator.js";
import { createVersioningTestRunner } from "../test-host.js";

const baseCode = `
  @versioned(Versions)
  @test namespace Service;

  enum Versions { v1, v2, v3 }

`;
async function testMutationLogic(
  code: string,
): Promise<{ v1: Namespace; v2: Namespace; v3: Namespace }> {
  const runner = await createVersioningTestRunner();
  const fullCode = baseCode + "\n" + code;
  const { Service } = (await runner.compile(fullCode)) as { Service: Namespace };
  const mutators = getVersioningMutators(runner.program, Service);
  strictEqual(mutators?.kind, "versioned");
  const [v1, v2, v3] = mutators.snapshots.map(
    (x) => unsafe_mutateSubgraphWithNamespace(runner.program, [x.mutator], Service).type,
  );
  return { v1, v2, v3 } as any;
}

async function itCanBeAddedRemovedAndRenamed(
  accessor: (ns: Namespace) => Map<string | symbol, Type & { name?: string | symbol }>,
  code: (decorators: string) => string,
) {
  it("added", async () => {
    const { v1, v2, v3 } = await testMutationLogic(code(`@added(Versions.v2)`));
    expect(accessor(v1).has("A")).toBe(false);
    expect(accessor(v2).has("A")).toBe(true);
    expect(accessor(v3).has("A")).toBe(true);
  });

  it("removed", async () => {
    const { v1, v2, v3 } = await testMutationLogic(code(`@removed(Versions.v2)`));
    expect(accessor(v1).has("A")).toBe(true);
    expect(accessor(v2).has("A")).toBe(false);
    expect(accessor(v3).has("A")).toBe(false);
  });

  it("added then removed", async () => {
    const { v1, v2, v3 } = await testMutationLogic(
      code(`
      @added(Versions.v2) 
      @removed(Versions.v3)`),
    );
    expect(accessor(v1).has("A")).toBe(false);
    expect(accessor(v2).has("A")).toBe(true);
    expect(accessor(v3).has("A")).toBe(false);
  });

  it("removed then added", async () => {
    const { v1, v2, v3 } = await testMutationLogic(
      code(`
      @removed(Versions.v2) 
      @added(Versions.v3)`),
    );
    expect(accessor(v1).has("A")).toBe(true);
    expect(accessor(v2).has("A")).toBe(false);
    expect(accessor(v3).has("A")).toBe(true);
  });

  it("once", async () => {
    const { v1, v2, v3 } = await testMutationLogic(code(`@renamedFrom(Versions.v2, "OldA")`));
    expect(accessor(v1).get("OldA")!.name).toBe("OldA");
    expect(accessor(v1).has("A")).toBe(false);

    expect(accessor(v2).get("A")!.name).toBe("A");
    expect(accessor(v2).has("OldA")).toBe(false);

    expect(accessor(v3).get("A")!.name).toBe("A");
    expect(accessor(v3).has("OldA")).toBe(false);
  });

  it("multiple times", async () => {
    const { v1, v2, v3 } = await testMutationLogic(
      code(`
      @renamedFrom(Versions.v2, "A_V1")  
      @renamedFrom(Versions.v3, "A_V2")  
    `),
    );
    expect(accessor(v1).get("A_V1")!.name).toBe("A_V1");
    expect(accessor(v1).has("A_V2")).toBe(false);
    expect(accessor(v1).has("A")).toBe(false);

    expect(accessor(v2).get("A_V2")!.name).toBe("A_V2");
    expect(accessor(v2).has("A_V1")).toBe(false);
    expect(accessor(v2).has("A")).toBe(false);

    expect(accessor(v3).get("A")!.name).toBe("A");
    expect(accessor(v3).has("A_V1")).toBe(false);
    expect(accessor(v3).has("A_V2")).toBe(false);
  });
}

describe("models", () => {
  itCanBeAddedRemovedAndRenamed(
    (ns) => ns.models,
    (decorators) => `${decorators} model A {}`,
  );
});

describe("model properties", () => {
  itCanBeAddedRemovedAndRenamed(
    (ns) => ns.models.get("Test")!.properties,
    (decorators) => `model Test { ${decorators} A: string; }`,
  );
});

describe("enums", () => {
  itCanBeAddedRemovedAndRenamed(
    (ns) => ns.enums,
    (decorators) => `${decorators} enum A {}`,
  );
});

describe("enum members", () => {
  itCanBeAddedRemovedAndRenamed(
    (ns) => ns.enums.get("Test")!.members,
    (decorators) => `enum Test { ${decorators} A: "a"; }`,
  );
});

describe("union", () => {
  itCanBeAddedRemovedAndRenamed(
    (ns) => ns.unions,
    (decorators) => `${decorators} union A {}`,
  );
});

describe("union variant", () => {
  itCanBeAddedRemovedAndRenamed(
    (ns) => ns.unions.get("Test")!.variants,
    (decorators) => `union Test { ${decorators} A: string; }`,
  );
});

describe("scalar", () => {
  itCanBeAddedRemovedAndRenamed(
    (ns) => ns.scalars,
    (decorators) => `${decorators} scalar A {}`,
  );
});

describe("operations", () => {
  itCanBeAddedRemovedAndRenamed(
    (ns) => ns.operations,
    (decorators) => `${decorators} op A(): void;`,
  );
});

describe("interfaces", () => {
  itCanBeAddedRemovedAndRenamed(
    (ns) => ns.interfaces,
    (decorators) => `${decorators} interface A {}`,
  );
});

describe("operations in interface", () => {
  itCanBeAddedRemovedAndRenamed(
    (ns) => ns.interfaces.get("Test")!.operations,
    (decorators) => `interface Test { ${decorators} A(): void; }`,
  );
});
