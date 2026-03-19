import {
  getMediaTypeHint,
  type Namespace,
  type Program,
  type Scalar,
  type Type,
} from "@typespec/compiler";
import { unsafe_mutateSubgraphWithNamespace } from "@typespec/compiler/experimental";
import { t } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { getVersioningMutators } from "../../src/mutator.js";
import { Tester } from "../test-host.js";

const baseCode = `
  @versioned(Versions)
  @test namespace Service;

  enum Versions { v1, v2, v3 }

`;
async function testMutationLogic(
  code: string,
): Promise<{ program: Program; v1: Namespace; v2: Namespace; v3: Namespace }> {
  const runner = await Tester.createInstance();
  const fullCode = baseCode + "\n" + code;
  const { Service } = await runner.compile(fullCode);
  const mutators = getVersioningMutators(runner.program, Service as Namespace);
  strictEqual(mutators?.kind, "versioned");
  const [v1, v2, v3] = mutators.snapshots.map(
    (x) =>
      unsafe_mutateSubgraphWithNamespace(runner.program, [x.mutator], Service as Namespace).type,
  );
  return { program: runner.program, v1, v2, v3 } as any;
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

  it("preserves @mediaTypeHint state on version snapshot clones", async () => {
    const { program, v1, v2, v3 } = await testMutationLogic(`
      @mediaTypeHint("application/merge-patch+json")
      model PatchBody {}
    `);

    for (const ns of [v1, v2, v3]) {
      const model = ns.models.get("PatchBody");
      expect(model).toBeDefined();
      expect(getMediaTypeHint(program, model!)).toBe("application/merge-patch+json");
    }
  });
});

describe("model properties", () => {
  const accessor = (ns: Namespace) => ns.models.get("Test")!.properties;
  itCanBeAddedRemovedAndRenamed(
    accessor,
    (decorators) => `model Test { ${decorators} A: string; }`,
  );

  it("can change the property type", async () => {
    const { v1, v2, v3 } = await testMutationLogic(`
      model Test {
        @typeChangedFrom(Versions.v2, string)
        a: int32;
    }`);
    expect((accessor(v1).get("a")!.type as Scalar).name).toBe("string");
    expect((accessor(v2).get("a")!.type as Scalar).name).toBe("int32");
    expect((accessor(v3).get("a")!.type as Scalar).name).toBe("int32");
  });

  it("can make a property optional", async () => {
    const { v1, v2, v3 } = await testMutationLogic(`
      model Test {
        @madeOptional(Versions.v2)
        a?: int32;
    }`);
    expect(accessor(v1).get("a")!.optional).toBe(false);
    expect(accessor(v2).get("a")!.optional).toBe(true);
    expect(accessor(v3).get("a")!.optional).toBe(true);
  });

  it("can make a property required", async () => {
    const { v1, v2, v3 } = await testMutationLogic(`
      model Test {
        @madeRequired(Versions.v2)
        a: int32;
    }`);
    expect(accessor(v1).get("a")!.optional).toBe(true);
    expect(accessor(v2).get("a")!.optional).toBe(false);
    expect(accessor(v3).get("a")!.optional).toBe(false);
  });
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
  const accessor = (ns: Namespace) => ns.operations;
  itCanBeAddedRemovedAndRenamed(accessor, (decorators) => `${decorators} op A(): void;`);

  it("can change the return type", async () => {
    const { v1, v2, v3 } = await testMutationLogic(`
      @returnTypeChangedFrom(Versions.v2, string)
      op a(): int32;
    `);
    expect((accessor(v1).get("a")!.returnType as Scalar).name).toBe("string");
    expect((accessor(v2).get("a")!.returnType as Scalar).name).toBe("int32");
    expect((accessor(v3).get("a")!.returnType as Scalar).name).toBe("int32");
  });
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

describe("apply multiple versioning mutators", () => {
  // https://github.com/microsoft/typespec/issues/9927
  it("properties with @added from different services are preserved", async () => {
    const { ServiceA, ServiceB, program } = await Tester.compile(t.code`
      @versioned(VersionsA)
      namespace ${t.namespace("ServiceA")} {
        enum VersionsA { av1, av2 }
        model Foo {
          name: string;
          @added(VersionsA.av2)
          description?: string;
        }
      }

      @versioned(VersionsB)
      namespace ${t.namespace("ServiceB")} {
        enum VersionsB { bv1, bv2 }
        model Bar {
          id: int32;
          @added(VersionsB.bv2)
          value?: string;
        }
      }
    `);

    const serviceAMutators = getVersioningMutators(program, ServiceA);
    const serviceBMutators = getVersioningMutators(program, ServiceB);

    strictEqual(serviceAMutators?.kind, "versioned");
    strictEqual(serviceBMutators?.kind, "versioned");

    const serviceAV2 = serviceAMutators.snapshots[1].mutator;
    const serviceBV2 = serviceBMutators.snapshots[1].mutator;

    const globalNs = program.getGlobalNamespaceType();
    const result = unsafe_mutateSubgraphWithNamespace(program, [serviceAV2, serviceBV2], globalNs);

    const mutatedGlobal = result.type as Namespace;
    const serviceA = mutatedGlobal.namespaces.get("ServiceA")!;
    const serviceB = mutatedGlobal.namespaces.get("ServiceB")!;

    const foo = serviceA.models.get("Foo")!;
    expect(foo.properties.has("name")).toBe(true);
    expect(foo.properties.has("description")).toBe(true);

    const bar = serviceB.models.get("Bar")!;
    expect(bar.properties.has("id")).toBe(true);
    expect(bar.properties.has("value")).toBe(true);
  });
});
