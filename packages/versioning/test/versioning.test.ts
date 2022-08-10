import {
  EnumType,
  InterfaceType,
  IntrinsicType,
  ModelType,
  NamespaceType,
  OperationType,
  ProjectionApplication,
  Type,
  UnionType,
} from "@cadl-lang/compiler";
import { BasicTestRunner, createTestWrapper } from "@cadl-lang/compiler/testing";
import { fail, ok, strictEqual } from "assert";
import { getVersions, indexVersions, Version } from "../src/versioning.js";
import { createVersioningTestHost } from "./test-host.js";
import {
  assertHasMembers,
  assertHasOperations,
  assertHasProperties,
  assertHasVariants,
} from "./utils.js";

describe("cadl: versioning", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    const host = await createVersioningTestHost();
    runner = createTestWrapper(
      host,
      (code) => `import "@cadl-lang/versioning";using Cadl.Versioning;\n${code}`
    );
  });

  describe("version compare", () => {
    it("compares arbitrary types in order", async () => {
      const { Test } = (await runner.compile(`
        @versioned(Versions)
        namespace MyService;

        enum Versions {
          v1: "1",
          v2: "version two",
          v3: "3"
        }

        @test model Test {
          @added(Versions.v1) a: 1;
          @added(Versions.v2) b: 1;
          @added(Versions.v3) c: 1;
        }
        `)) as { Test: ModelType };

      const v1 = project(Test, "1");
      ok(v1.properties.has("a"), "v1 has a");
      ok(!v1.properties.has("b"), "v1 doesn't have b");
      ok(!v1.properties.has("c"), "v1 desn't have c");
      const v2 = project(Test, "version two");
      ok(v2.properties.has("a"), "v2 has a");
      ok(v2.properties.has("b"), "v2 has b");
      ok(!v2.properties.has("c"), "v2 doesn't have c");
      const v3 = project(Test, "3");
      ok(v3.properties.has("a"));
      ok(v3.properties.has("b"));
      ok(v3.properties.has("c"));
    });
  });

  describe("models", () => {
    it("can rename itself", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedModel(
        ["v1", "v2"],
        `
        @renamedFrom(Versions.v2, "OldTest")
        model Test { a: int32; }`
      );

      strictEqual(v1.name, "OldTest");
      strictEqual(v2.name, "Test");
      assertModelProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source
      );
    });

    it("can add models", async () => {
      const {
        projections: [v1, v2],
      } = await versionedModel(["v1", "v2"], `@added(Versions.v2) model Test {}`);
      strictEqual(v1.kind, "Intrinsic");
      strictEqual((v1 as any as IntrinsicType).name, "never");
      strictEqual(v2.kind, "Model");
    });

    it("can add properties", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedModel(
        ["v1", "v2", "v3"],
        `model Test {
          a: int32;
          @added(Versions.v2) b: int32;
          @added(Versions.v3) c: int32;
          @added(Versions.v2) nested: Nested;
        }
        model Nested {
          d: int32;
          @added(Versions.v3) e: int32;
        }
        `
      );

      assertHasProperties(v1, ["a"]);
      assertHasProperties(v2, ["a", "b", "nested"]);
      assertHasProperties(v2.properties.get("nested")!.type as ModelType, ["d"]);
      assertHasProperties(v3, ["a", "b", "c", "nested"]);
      assertHasProperties(v3.properties.get("nested")!.type as ModelType, ["d", "e"]);

      assertModelProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
        ],
        source
      );
    });

    it("can remove models", async () => {
      const {
        projections: [v1, v2],
      } = await versionedModel(["v1", "v2"], `@removed(Versions.v2) model Test {}`);

      strictEqual(v1.kind, "Model");
      strictEqual(v2.kind, "Intrinsic");
      strictEqual((v2 as any as IntrinsicType).name, "never");
    });

    it("can remove properties", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedModel(
        ["v1", "v2", "v3"],
        `model Test {
          a: int32;
          @removed(Versions.v2) b: int32;
          @removed(Versions.v3) c: int32;
          @removed(Versions.v3) nested: Nested;
        }
        model Nested {
          d: int32;
          @removed(Versions.v2) e: int32;
        }
        `
      );
      assertHasProperties(v1, ["a", "b", "c", "nested"]);
      assertHasProperties(v1.properties.get("nested")!.type as ModelType, ["d", "e"]);
      assertHasProperties(v2, ["a", "c", "nested"]);
      assertHasProperties(v2.properties.get("nested")!.type as ModelType, ["d"]);
      assertHasProperties(v3, ["a"]);
      assertModelProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
        ],
        source
      );
    });

    it("can rename properties", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedModel(
        ["v1", "v2", "v3"],
        `model Test {
          a: int32;
          @renamedFrom(Versions.v2, "foo") b: int32;
          @renamedFrom(Versions.v3, "bar") c: int32;
        }`
      );

      assertHasProperties(v1, ["a", "foo", "bar"]);
      assertHasProperties(v2, ["a", "b", "bar"]);
      assertHasProperties(v3, ["a", "b", "c"]);
      assertModelProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
        ],
        source
      );
    });

    it("can make properties optional", async () => {
      const {
        projections: [v1, v2],
      } = await versionedModel(
        ["v1", "v2"],
        `model Test {
          a: int32;
          @madeOptional(Versions.v2) b?: int32;
        }`
      );

      ok(v1.properties.get("a")!.optional === false);
      ok(v1.properties.get("b")!.optional === false);
      ok(v2.properties.get("a")!.optional === false);
      ok(v2.properties.get("b")!.optional === true);
    });

    it("can spread versioned model", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedModel(
        ["v1", "v2"],
        `model Test {
          t: string;
          ...Spreadable
        }
        model Spreadable {
          a: int32;
          @added(Versions.v2) b: int32;
        }
        `
      );

      assertHasProperties(v1, ["t", "a"]);
      assertHasProperties(v2, ["t", "a", "b"]);

      assertModelProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source
      );
    });

    async function versionedModel(versions: string[], model: string) {
      const { Test } = (await runner.compile(`
      @versioned(Versions)
      namespace MyService;

      enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

      @test ${model}
      `)) as { Test: ModelType };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("unions", () => {
    it("can rename itself", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedUnion(
        ["v1", "v2"],
        `
        @renamedFrom(Versions.v2, "OldTest")
        union Test {}`
      );

      strictEqual(v1.name, "OldTest");
      strictEqual(v2.name, "Test");
      assertUnionProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source
      );
    });
    it("can add unions", async () => {
      const {
        projections: [v1, v2],
      } = await versionedUnion(["v1", "v2"], `@added(Versions.v2) union Test {}`);

      strictEqual(v1.kind, "Intrinsic");
      strictEqual((v1 as any as IntrinsicType).name, "never");
      strictEqual(v2.kind, "Union");
    });

    it("can add variants", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedUnion(
        ["v1", "v2", "v3"],
        `union Test {
          a: int8;
          @added(Versions.v2) b: int16;
          @added(Versions.v3) c: int32;
          @added(Versions.v2) nested: Nested;
        }
        model Nested {
          d: int32;
          @added(Versions.v3) e: int32;
        }
        `
      );
      assertHasVariants(v1, ["a"]);

      assertHasVariants(v2, ["a", "b", "nested"]);
      assertHasProperties(v2.variants.get("nested")!.type as ModelType, ["d"]);
      assertHasVariants(v3, ["a", "b", "c", "nested"]);
      assertHasProperties(v3.variants.get("nested")!.type as ModelType, ["d", "e"]);
      assertUnionProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
        ],
        source
      );
    });

    it("can remove unions", async () => {
      const {
        projections: [v1, v2],
      } = await versionedUnion(["v1", "v2"], `@removed(Versions.v2) union Test {}`);

      strictEqual(v2.kind, "Intrinsic");
      strictEqual((v2 as any as IntrinsicType).name, "never");
      strictEqual(v1.kind, "Union");
    });

    it("can remove variants", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedUnion(
        ["v1", "v2", "v3"],
        `union Test {
          a: int32;
          @removed(Versions.v2) b: int32;
          @removed(Versions.v3) c: int32;
          @removed(Versions.v3) nested: Nested;
        }
        model Nested {
          d: int32;
          @removed(Versions.v2) e: int32;
        }
        `
      );
      assertHasVariants(v1, ["a", "b", "c", "nested"]);
      assertHasProperties(v1.variants.get("nested")!.type as ModelType, ["d", "e"]);
      assertHasVariants(v2, ["a", "c", "nested"]);
      assertHasProperties(v2.variants.get("nested")!.type as ModelType, ["d"]);
      assertHasVariants(v3, ["a"]);
      assertUnionProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
        ],
        source
      );
    });

    it("can rename variants", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedUnion(
        ["v1", "v2", "v3"],
        `union Test {
          a: int32;
          @renamedFrom(Versions.v2, "foo") b: int32;
          @renamedFrom(Versions.v3, "bar") c: int32;
        }`
      );

      assertHasVariants(v1, ["a", "foo", "bar"]);
      assertHasVariants(v2, ["a", "b", "bar"]);
      assertHasVariants(v3, ["a", "b", "c"]);
      assertUnionProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
        ],
        source
      );
    });

    async function versionedUnion(versions: string[], union: string) {
      const { Test } = (await runner.compile(`
      @versioned(Versions)
      namespace MyService;

      enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

      @test ${union}
      `)) as { Test: UnionType };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("operations", () => {
    it("can rename itself", async () => {
      const {
        projections: [v1, v2],
      } = await versionedOperation(
        ["v1", "v2"],
        `
        @renamedFrom(Versions.v2, "OldTest")
        op Test(): void;`
      );

      strictEqual(v1.name, "OldTest");
      strictEqual(v2.name, "Test");
    });

    it("can be added", async () => {
      const {
        projections: [v1, v2],
      } = await versionedOperation(["v1", "v2"], `@added(Versions.v2) op Test(): void;`);

      strictEqual(v1.kind, "Intrinsic");
      strictEqual((v1 as any as IntrinsicType).name, "never");
      strictEqual(v2.kind, "Operation");
    });
    it("can be removed", async () => {
      const {
        projections: [v1, v2],
      } = await versionedOperation(["v1", "v2"], `@removed(Versions.v2) op Test(): void;`);

      strictEqual(v2.kind, "Intrinsic");
      strictEqual((v2 as any as IntrinsicType).name, "never");
      strictEqual(v1.kind, "Operation");
    });
    it("can version parameters", async () => {
      const {
        projections: [v1, v2],
      } = await versionedOperation(["v1", "v2"], `op Test(@added(Versions.v2) a: string): void;`);

      assertHasProperties(v1.parameters, []);
      assertHasProperties(v2.parameters, ["a"]);
    });
    it("can version return type", async () => {
      const {
        projections: [v1, v2],
      } = await versionedOperation(
        ["v1", "v2"],
        `
        op Test(): ReturnTypes;
        union ReturnTypes {
          a: string;
          @added(Versions.v2) b: int32;
        }
        `
      );

      assertHasVariants(v1.returnType as UnionType, ["a"]);
      assertHasVariants(v2.returnType as UnionType, ["a", "b"]);
    });

    async function versionedOperation(versions: string[], operation: string) {
      const { Test } = (await runner.compile(`
        @versioned(Versions)
        namespace MyService;

        enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

        @test ${operation}
      `)) as { Test: OperationType };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("interfaces", () => {
    it("can rename itself", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedInterface(
        ["v1", "v2"],
        `
        @renamedFrom(Versions.v2, "OldTest")
        interface Test { }`
      );

      strictEqual(v1.name, "OldTest");
      strictEqual(v2.name, "Test");
      assertInterfaceProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source
      );
    });

    it("can be added", async () => {
      const {
        projections: [v1, v2],
      } = await versionedInterface(["v1", "v2"], `@added(Versions.v2) interface Test { }`);

      strictEqual(v1.kind, "Intrinsic");
      strictEqual((v1 as any as IntrinsicType).name, "never");
      strictEqual(v2.kind, "Interface");
    });
    it("can be removed", async () => {
      const {
        projections: [v1, v2],
      } = await versionedInterface(["v1", "v2"], `@removed(Versions.v2) interface Test { }`);

      strictEqual(v2.kind, "Intrinsic");
      strictEqual((v2 as any as IntrinsicType).name, "never");
      strictEqual(v1.kind, "Interface");
    });

    it("can add members", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedInterface(
        ["v1", "v2"],
        `interface Test {
        @added(Versions.v2) foo(): void;
      }`
      );

      assertHasOperations(v1, []);
      assertHasOperations(v2, ["foo"]);
      assertInterfaceProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source
      );
    });

    it("can remove members", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedInterface(
        ["v1", "v2"],
        `interface Test {
        @removed(Versions.v2) foo(): void;
      }`
      );

      assertHasOperations(v1, ["foo"]);
      assertHasOperations(v2, []);
      assertInterfaceProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source
      );
    });

    it("can rename members", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedInterface(
        ["v1", "v2"],
        `interface Test {
          @renamedFrom(Versions.v2, "bar") foo(): void;
        }`
      );

      assertHasOperations(v1, ["bar"]);
      assertHasOperations(v2, ["foo"]);
      assertInterfaceProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source
      );
    });

    it("can version parameters", async () => {
      const {
        projections: [v1, v2],
      } = await versionedInterface(
        ["v1", "v2"],
        `interface Test { 
          op foo(@added(Versions.v2) a: string): void;
        }`
      );

      assertHasProperties(v1.operations.get("foo")!.parameters, []);
      assertHasProperties(v2.operations.get("foo")!.parameters, ["a"]);
    });

    async function versionedInterface(versions: string[], iface: string) {
      const { Test } = (await runner.compile(`
        @versioned(Versions)
        namespace MyService;

        enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

        @test ${iface}
      `)) as { Test: InterfaceType };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("enums", () => {
    it("can rename itself", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedEnum(
        ["v1", "v2"],
        `
        @renamedFrom(Versions.v2, "OldTest")
        enum Test { }`
      );

      strictEqual(v1.name, "OldTest");
      strictEqual(v2.name, "Test");
      assertEnumProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source
      );
    });

    it("can add enums", async () => {
      const {
        projections: [v1, v2],
      } = await versionedEnum(["v1", "v2"], `@added(Versions.v2) enum Test {}`);
      strictEqual(v1.kind, "Intrinsic");
      strictEqual((v1 as any as IntrinsicType).name, "never");
      strictEqual(v2.kind, "Enum");
    });

    it("can add members", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedEnum(
        ["v1", "v2", "v3"],
        `enum Test {
          a: 1;
          @added(Versions.v2) b: 2;
          @added(Versions.v3) c: 3;
        }
        `
      );

      assertHasMembers(v1, ["a"]);
      assertHasMembers(v2, ["a", "b"]);
      assertHasMembers(v3, ["a", "b", "c"]);
      assertEnumProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
        ],
        source
      );
    });

    it("can remove enums", async () => {
      const {
        projections: [v1, v2],
      } = await versionedEnum(["v1", "v2"], `@removed(Versions.v2) enum Test {}`);

      strictEqual(v1.kind, "Enum");
      strictEqual(v2.kind, "Intrinsic");
      strictEqual((v2 as any as IntrinsicType).name, "never");
    });

    it("can remove members", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedEnum(
        ["v1", "v2", "v3"],
        `enum Test {
          a: 1;
          @removed(Versions.v2) b: 2;
          @removed(Versions.v3) c: 3;
        }
        `
      );
      assertHasMembers(v1, ["a", "b", "c"]);
      assertHasMembers(v2, ["a", "c"]);
      assertHasMembers(v3, ["a"]);

      assertEnumProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
        ],
        source
      );
    });

    it("can rename members", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedEnum(
        ["v1", "v2", "v3"],
        `enum Test {
          a: 1;
          @renamedFrom(Versions.v2, "foo") b: 2;
          @renamedFrom(Versions.v3, "bar") c: 3;
        }`
      );

      assertHasMembers(v1, ["a", "foo", "bar"]);
      assertHasMembers(v2, ["a", "b", "bar"]);
      assertHasMembers(v3, ["a", "b", "c"]);
      assertEnumProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
        ],
        source
      );
    });

    async function versionedEnum(versions: string[], enumCode: string) {
      const { Test } = (await runner.compile(`
        @versioned(Versions)
        namespace MyService;

        enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

        @test ${enumCode}
      `)) as { Test: EnumType };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  function assertModelProjectsTo(types: [ModelType, string][], target: ModelType) {
    types.forEach(([m, version]) => {
      const projection = project(m, version, "from");
      strictEqual(projection.properties.size, target.properties.size);
      for (const prop of projection.properties.values()) {
        ok(target.properties.has(prop.name));
      }
    });
  }

  function assertUnionProjectsTo(types: [UnionType, string][], target: UnionType) {
    types.forEach(([m, version]) => {
      const projection = project(m, version, "from");
      strictEqual(projection.variants.size, target.variants.size);
      for (const prop of projection.variants.values()) {
        ok(target.variants.has(prop.name));
      }
    });
  }
  function assertInterfaceProjectsTo(types: [InterfaceType, string][], target: InterfaceType) {
    types.forEach(([m, version]) => {
      const projection = project(m, version, "from");
      strictEqual(projection.operations.size, target.operations.size);
      for (const prop of projection.operations.values()) {
        ok(target.operations.has(prop.name), "source interface should have operation " + prop.name);
      }
    });
  }
  function assertEnumProjectsTo(types: [EnumType, string][], target: EnumType) {
    types.forEach(([m, version]) => {
      const projection = project(m, version, "from");
      strictEqual(projection.members.length, target.members.length);
      for (const member of projection.members) {
        ok(
          target.members.findIndex((m) => m.name === member.name) > -1,
          "enum should have operation " + member.name
        );
      }
    });
  }

  function project<T extends Type>(target: T, version: string, direction: "to" | "from" = "to"): T {
    const [, versions] = getVersions(runner.program, target.projectionBase ?? target);
    const actualVersion = versions
      ?.getVersions()
      .find((x) => x.value === version || x.name === version);
    if (actualVersion === undefined) {
      fail(`Should have found the version ${version}`);
    }
    const versionMap = new Map<NamespaceType, Version>([[actualVersion.namespace, actualVersion]]);
    const versionKey = indexVersions(runner.program, versionMap);
    const projection: ProjectionApplication = {
      arguments: [versionKey],
      projectionName: "v",
      direction,
    };
    const projector = runner.program.enableProjections([projection], target);
    return projector.projectedTypes.get(target) as T;
  }
});
