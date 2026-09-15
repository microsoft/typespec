import {
  getMediaTypeHint,
  type DecoratorContext,
  type Model,
  type Namespace,
  type Program,
  type Scalar,
  type Type,
} from "@typespec/compiler";
import { unsafe_mutateSubgraphWithNamespace } from "@typespec/compiler/experimental";
import { expectDiagnostics, mockFile, t } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { getMadeOptionalOn, getMadeRequiredOn } from "../../src/decorators.js";
import { getVersioningMutators } from "../../src/mutator.js";
import { Tester } from "../test-host.js";

const baseCode = `
  @versioned(Versions)
  @test namespace Service;

  enum Versions { v1, v2, v3 }

`;
async function testMutationLogic(
  code: string,
  tester = Tester,
): Promise<{ program: Program; v1: Namespace; v2: Namespace; v3: Namespace }> {
  const runner = await tester.createInstance();
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

  describe("derived optionality", () => {
    const optionalityTester = Tester.files({
      "optionality.js": mockFile.js({
        $setOptionality(_context: DecoratorContext, model: Model, optional: boolean) {
          for (const property of model.properties.values()) {
            property.optional = optional;
          }
        },
      }),
      "optionality.tsp": `
        import "./optionality.js";
        extern dec setOptionality(target: TypeSpec.Reflection.Model, optional: valueof boolean);
      `,
    }).import("./optionality.tsp");

    it.each([
      "model Test is OptionalProperties<Source>;",
      "model Test { ...OptionalProperties<Source>; }",
      `
        model BeforeSpread { ...Source; }
        model BeforeCopy is BeforeSpread;
        model Optional is OptionalProperties<BeforeCopy>;
        model AfterSpread { ...Optional; }
        model Test is AfterSpread;
      `,
    ])("keeps transformed properties optional in every snapshot: %s", async (derived) => {
      const { program, v1, v2, v3 } = await testMutationLogic(`
        model Source {
          @madeRequired(Versions.v2)
          a: string;
        }
        ${derived}
      `);
      for (const ns of [v1, v2, v3]) {
        const property = accessor(ns).get("a")!;
        expect(property.optional).toBe(true);
        expect(getMadeRequiredOn(program, property)).toBeUndefined();
      }
      expect(v1.models.get("Source")!.properties.get("a")!.optional).toBe(true);
      expect(v2.models.get("Source")!.properties.get("a")!.optional).toBe(false);
      expect(v3.models.get("Source")!.properties.get("a")!.optional).toBe(false);
    });

    it.each([true, false])("recognizes custom optionality transforms to %s", async (optional) => {
      const { program, v1, v2, v3 } = await testMutationLogic(
        `
          model Source {
            @${optional ? "madeRequired" : "madeOptional"}(Versions.v2)
            a${optional ? "" : "?"}: string;
          }
          model Before { ...Source; }
          @setOptionality(${optional})
          model Changed { ...Before; }
          model After is Changed;
          model Test { ...After; }
        `,
        optionalityTester,
      );
      for (const ns of [v1, v2, v3]) {
        const property = accessor(ns).get("a")!;
        expect(property.optional).toBe(optional);
        expect(getMadeOptionalOn(program, property)).toBeUndefined();
        expect(getMadeRequiredOn(program, property)).toBeUndefined();
      }
    });

    it.each([true, false])(
      "validates new history on a copy transformed to %s",
      async (optional) => {
        const diagnostics = await optionalityTester.diagnose(`
        ${baseCode}
        model Source {
          @${optional ? "madeRequired" : "madeOptional"}(Versions.v2)
          a${optional ? "" : "?"}: string;
        }
        @setOptionality(${optional})
        model Changed { ...Source; }
        model Test { ...Changed; }
        @@${optional ? "madeRequired" : "madeOptional"}(Test.a, Versions.v2);
      `);
        expectDiagnostics(diagnostics, {
          code: `@typespec/versioning/${optional ? "made-required-optional" : "made-optional-not-optional"}`,
        });
      },
    );

    it("does not revive history when a later transform restores the original optionality", async () => {
      const { program, v1, v2, v3 } = await testMutationLogic(
        `
          model Source {
            @madeRequired(Versions.v2)
            a: string;
          }
          @setOptionality(true)
          model Optional { ...Source; }
          model Copy { ...Optional; }
          @setOptionality(false)
          model Required { ...Copy; }
          model Test { ...Required; }
        `,
        optionalityTester,
      );
      for (const ns of [v1, v2, v3]) {
        expect(accessor(ns).get("a")!.optional).toBe(false);
        expect(getMadeRequiredOn(program, accessor(ns).get("a")!)).toBeUndefined();
      }
    });

    it("retains history when a transform makes no discernible optionality change", async () => {
      const { program, v1, v2, v3 } = await testMutationLogic(`
        model Source {
          @madeOptional(Versions.v2)
          a?: string;
        }
        model Test { ...OptionalProperties<Source>; }
      `);
      expect(accessor(v1).get("a")!.optional).toBe(false);
      expect(accessor(v2).get("a")!.optional).toBe(true);
      expect(accessor(v3).get("a")!.optional).toBe(true);
      for (const ns of [v1, v2, v3]) {
        expect(getMadeOptionalOn(program, accessor(ns).get("a")!)?.name).toBe("v2");
      }
    });

    it.each([true, false])("preserves unchanged optionality history (%s)", async (optional) => {
      const { program, v1, v2, v3 } = await testMutationLogic(`
        model Source {
          @${optional ? "madeOptional" : "madeRequired"}(Versions.v2)
          a${optional ? "?" : ""}: string;
        }
        model Spread { ...Source; }
        model Copy is Spread;
        model Test { ...Copy; }
      `);
      expect(accessor(v1).get("a")!.optional).toBe(!optional);
      expect(accessor(v2).get("a")!.optional).toBe(optional);
      expect(accessor(v3).get("a")!.optional).toBe(optional);
      for (const ns of [v1, v2, v3]) {
        const getter = optional ? getMadeOptionalOn : getMadeRequiredOn;
        expect(getter(program, accessor(ns).get("a")!)?.name).toBe("v2");
      }
    });

    it("preserves unrelated history on transformed properties", async () => {
      const { v1, v2, v3 } = await testMutationLogic(`
        model Source {
          @madeRequired(Versions.v2)
          @renamedFrom(Versions.v2, "old")
          @typeChangedFrom(Versions.v2, string)
          a: int32;
          @added(Versions.v2)
          @madeRequired(Versions.v3)
          added: string;
          @removed(Versions.v3)
          @madeRequired(Versions.v2)
          removed: string;
        }
        model Test { ...OptionalProperties<Source>; }
      `);
      expect(accessor(v1).get("old")!.optional).toBe(true);
      expect((accessor(v1).get("old")!.type as Scalar).name).toBe("string");
      expect(accessor(v1).has("a")).toBe(false);
      for (const ns of [v2, v3]) {
        expect(accessor(ns).get("a")!.optional).toBe(true);
        expect((accessor(ns).get("a")!.type as Scalar).name).toBe("int32");
        expect(accessor(ns).has("old")).toBe(false);
        expect(accessor(ns).get("added")!.optional).toBe(true);
      }
      expect(accessor(v1).has("added")).toBe(false);
      expect(accessor(v1).get("removed")!.optional).toBe(true);
      expect(accessor(v2).get("removed")!.optional).toBe(true);
      expect(accessor(v3).has("removed")).toBe(false);
    });

    it("uses newly authored optionality history after a transform", async () => {
      const { v1, v2, v3 } = await testMutationLogic(`
        model Source {
          @madeRequired(Versions.v2)
          a: string;
        }
        @withOptionalProperties
        model Changed { ...Source; }
        @@madeOptional(Changed.a, Versions.v3);
        model Test { ...Changed; }
      `);
      expect(accessor(v1).get("a")!.optional).toBe(false);
      expect(accessor(v2).get("a")!.optional).toBe(false);
      expect(accessor(v3).get("a")!.optional).toBe(true);
    });
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
