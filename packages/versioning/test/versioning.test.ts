import {
  projectProgram,
  type Enum,
  type Interface,
  type IntrinsicType,
  type Model,
  type Namespace,
  type Operation,
  type Program,
  type ProjectionApplication,
  type Scalar,
  type Type,
  type Union,
} from "@typespec/compiler";
import {
  createTestWrapper,
  expectDiagnosticEmpty,
  expectDiagnostics,
  type BasicTestRunner,
} from "@typespec/compiler/testing";
import { deepStrictEqual, fail, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { buildVersionProjections, indexTimeline } from "../src/projection.js";
import type { Version } from "../src/types.js";
import { VersioningTimeline } from "../src/versioning-timeline.js";
import { getVersions } from "../src/versioning.js";
import { createVersioningTestHost } from "./test-host.js";
import {
  assertHasMembers,
  assertHasOperations,
  assertHasProperties,
  assertHasVariants,
} from "./utils.js";

describe("versioning: logic", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    const host = await createVersioningTestHost();
    runner = createTestWrapper(host, { autoUsings: ["TypeSpec.Versioning"] });
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
        `)) as { Test: Model };

      const v1 = project(Test, "1");
      ok(v1.properties.has("a"), "v1 has a");
      ok(!v1.properties.has("b"), "v1 doesn't have b");
      ok(!v1.properties.has("c"), "v1 doesn't have c");
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
    it("can be renamed", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedModel(
        ["v1", "v2"],
        `
        @renamedFrom(Versions.v2, "OldTest")
        model Test { a: int32; }`,
      );

      strictEqual(v1.name, "OldTest");
      strictEqual(v2.name, "Test");
      assertModelProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source,
      );
    });

    it("can be added", async () => {
      const {
        projections: [v1, v2],
      } = await versionedModel(["v1", "v2"], `@added(Versions.v2) model Test {}`);
      strictEqual(v1.kind, "Intrinsic");
      strictEqual((v1 as any as IntrinsicType).name, "never");
      strictEqual(v2.kind, "Model");
    });

    it("can be removed", async () => {
      const {
        projections: [v1, v2],
      } = await versionedModel(["v1", "v2"], `@removed(Versions.v2) model Test {}`);

      strictEqual(v1.kind, "Model");
      strictEqual(v2.kind, "Intrinsic");
      strictEqual((v2 as any as IntrinsicType).name, "never");
    });

    it("can be spread when versioned", async () => {
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
        `,
      );

      assertHasProperties(v1, ["t", "a"]);
      assertHasProperties(v2, ["t", "a", "b"]);

      assertModelProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source,
      );
    });

    it("can be renamed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5],
      } = await versionedModel(
        ["v1", "v2", "v3", "v4", "v5"],
        `
        @renamedFrom(Versions.v2, "Foo")
        @renamedFrom(Versions.v3, "Bar")
        @renamedFrom(Versions.v5, "Baz")
        model Test {
          name: string,
        }`,
      );
      strictEqual((v1 as Model).name, "Foo");
      strictEqual((v2 as Model).name, "Bar");
      strictEqual((v3 as Model).name, "Baz");
      strictEqual((v4 as Model).name, "Baz");
      strictEqual((v5 as Model).name, "Test");
    });

    it("can be added/removed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5, v6],
      } = await versionedModel(
        ["v1", "v2", "v3", "v4", "v5", "v6"],
        `
        @added(Versions.v2)
        @removed(Versions.v3)
        @added(Versions.v5)
        @removed(Versions.v6)
        model Test {
          val: int32;
        }`,
      );
      strictEqual(v1.kind, "Intrinsic");
      strictEqual((v1 as any as IntrinsicType).name, "never");
      strictEqual(v2.kind, "Model");
      strictEqual((v2 as Model).name, "Test");
      strictEqual(v3.kind, "Intrinsic");
      strictEqual((v3 as any as IntrinsicType).name, "never");
      strictEqual(v4.kind, "Intrinsic");
      strictEqual((v4 as any as IntrinsicType).name, "never");
      strictEqual(v5.kind, "Model");
      strictEqual((v5 as Model).name, "Test");
      strictEqual(v6.kind, "Intrinsic");
      strictEqual((v6 as any as IntrinsicType).name, "never");
    });

    async function versionedModel(versions: string[], model: string) {
      const { Test } = (await runner.compile(`
      @versioned(Versions)
      namespace MyService;

      enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

      @test ${model}
      `)) as { Test: Model };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("model properties", () => {
    it("can be added", async () => {
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
        `,
      );

      assertHasProperties(v1, ["a"]);
      assertHasProperties(v2, ["a", "b", "nested"]);
      assertHasProperties(v2.properties.get("nested")!.type as Model, ["d"]);
      assertHasProperties(v3, ["a", "b", "c", "nested"]);
      assertHasProperties(v3.properties.get("nested")!.type as Model, ["d", "e"]);

      assertModelProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
        ],
        source,
      );
    });

    it("can be added after parent", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedModel(
        ["v1", "v2"],
        `@added(Versions.v1)
        model Test {
          a: int32;
          @added(Versions.v2)
          b: NewThing;
        }

        @added(Versions.v2)
        model NewThing {
          val: string;
        }
        `,
      );
      assertHasProperties(v1, ["a"]);
      assertHasProperties(v2, ["a", "b"]);

      assertModelProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source,
      );
    });

    it("can be removed", async () => {
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
        `,
      );
      assertHasProperties(v1, ["a", "b", "c", "nested"]);
      assertHasProperties(v1.properties.get("nested")!.type as Model, ["d", "e"]);
      assertHasProperties(v2, ["a", "c", "nested"]);
      assertHasProperties(v2.properties.get("nested")!.type as Model, ["d"]);
      assertHasProperties(v3, ["a"]);
      assertModelProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
        ],
        source,
      );
    });

    it("can be removed respecting model versioning with explicit versions", async () => {
      const {
        source,
        projections: [v2, v3, v4],
      } = await versionedModel(
        ["v2", "v3", "v4"],
        `@added(Versions.v2)
        model Test {
          a: int32;
          @removed(Versions.v3)
          @added(Versions.v4)
          b: int32;
        }
        `,
      );

      assertHasProperties(v2, ["a", "b"]);
      assertHasProperties(v3, ["a"]);
      assertHasProperties(v4, ["a", "b"]);

      assertModelProjectsTo(
        [
          [v2, "v2"],
          [v3, "v3"],
          [v4, "v4"],
        ],
        source,
      );
    });

    it("can be removed respecting model versioning with implicit versions", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedModel(
        ["v1", "v2", "v3"],
        `model Test {
          a: int32;
          @removed(Versions.v2)
          @added(Versions.v3)
          b: int32;
        }
        `,
      );

      assertHasProperties(v1, ["a", "b"]);
      assertHasProperties(v2, ["a"]);
      assertHasProperties(v3, ["a", "b"]);

      assertModelProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
        ],
        source,
      );
    });

    it("can be renamed", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedModel(
        ["v1", "v2", "v3"],
        `model Test {
          a: int32;
          @renamedFrom(Versions.v2, "foo") b: int32;
          @renamedFrom(Versions.v3, "bar") c: int32;
        }`,
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
        source,
      );
    });

    it("can be renamed multiple times", async () => {
      const {
        source,
        projections: [v1, v2, v3, v4, v5],
      } = await versionedModel(
        ["v1", "v2", "v3", "v4", "v5"],
        `model Test {
          @renamedFrom(Versions.v2, "a")
          @renamedFrom(Versions.v3, "b")
          @renamedFrom(Versions.v5, "c")
          d: int32;
        }`,
      );
      assertHasProperties(v1, ["a"]);
      assertHasProperties(v2, ["b"]);
      assertHasProperties(v3, ["c"]);
      assertHasProperties(v4, ["c"]);
      assertHasProperties(v5, ["d"]);

      assertModelProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
          [v4, "v4"],
          [v5, "v5"],
        ],
        source,
      );
    });

    it("emits diagnostic when renaming causes duplicates", async () => {
      const code = `
      @versioned(Versions)
      @service({
        title: "Widget Service",
      })
      namespace DemoService;

      enum Versions {
        "v1",
        "v2",
        "v3",
      }
      
      model Test {
        @key id: string;
        weight: int32;
        @renamedFrom(Versions.v3, "color") shade: string;
        @added(Versions.v2)
        color: string;
      }
      `;
      const diagnostics = await runner.diagnose(code);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/renamed-duplicate-property",
        message:
          "Property 'color' marked with '@renamedFrom' conflicts with existing property in version v2.",
      });
    });

    it("can be added/removed multiple times", async () => {
      const {
        source,
        projections: [v1, v2, v3, v4, v5, v6],
      } = await versionedModel(
        ["v1", "v2", "v3", "v4", "v5", "v6"],
        `model Test {
          @added(Versions.v2)
          @removed(Versions.v3)
          @added(Versions.v5)
          @removed(Versions.v6)
          val: int32;
        }`,
      );
      assertHasProperties(v1, []);
      assertHasProperties(v2, ["val"]);
      assertHasProperties(v3, []);
      assertHasProperties(v4, []);
      assertHasProperties(v5, ["val"]);
      assertHasProperties(v6, []);

      assertModelProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
          [v4, "v4"],
          [v5, "v5"],
          [v6, "v6"],
        ],
        source,
      );
    });

    it("can be made optional", async () => {
      const {
        projections: [v1, v2],
      } = await versionedModel(
        ["v1", "v2"],
        `model Test {
          a: int32;
          @madeOptional(Versions.v2) b?: int32;
        }`,
      );

      ok(v1.properties.get("a")!.optional === false);
      ok(v1.properties.get("b")!.optional === false);
      ok(v2.properties.get("a")!.optional === false);
      ok(v2.properties.get("b")!.optional === true);
    });

    it("can be made required", async () => {
      const {
        projections: [v1, v2],
      } = await versionedModel(
        ["v1", "v2"],
        `model Test {
          a: int32;
          @madeRequired(Versions.v2) b: int32;
        }`,
      );

      ok(v1.properties.get("a")!.optional === false);
      ok(v1.properties.get("b")!.optional === true);
      ok(v2.properties.get("a")!.optional === false);
      ok(v2.properties.get("b")!.optional === false);
    });

    it("can change type to versioned models", async () => {
      const {
        projections: [v1, v2, v3],
      } = await versionedModel(
        ["v1", "v2", "v3"],
        `
        @test
        model Original {}

        @test
        @added(Versions.v2)
        model Updated {}

        @test
        model Test {
          @added(Versions.v2)
          @typeChangedFrom(Versions.v3, Original)
          prop: Updated;
        }
        `,
      );

      ok(v1.properties.get("prop") === undefined);
      ok((v2.properties.get("prop")!.type as Model).name === "Original");
      ok((v3.properties.get("prop")!.type as Model).name === "Updated");
    });

    it("can change type over multiple versions", async () => {
      const {
        projections: [v1, v2, v3],
      } = await versionedModel(
        ["v1", "v2", "v3"],
        `
        model Test {
          @typeChangedFrom(Versions.v2, string)
          @typeChangedFrom(Versions.v3, utcDateTime)
          changed: MyDate;
        }
        
        model MyDate {}
        `,
      );

      ok((v1.properties.get("changed")!.type as Scalar).name === "string");
      ok((v2.properties.get("changed")!.type as Scalar).name === "utcDateTime");
      ok((v3.properties.get("changed")!.type as Model).name === "MyDate");
    });

    async function versionedModel(versions: string[], model: string) {
      const { Test } = (await runner.compile(`
      @versioned(Versions)
      namespace MyService;

      enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

      @test ${model}
      `)) as { Test: Model };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("unions", () => {
    it("can be renamed", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedUnion(
        ["v1", "v2"],
        `
        @renamedFrom(Versions.v2, "OldTest")
        union Test {}`,
      );

      strictEqual(v1.name, "OldTest");
      strictEqual(v2.name, "Test");
      assertUnionProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source,
      );
    });

    it("can be added", async () => {
      const {
        projections: [v1, v2],
      } = await versionedUnion(["v1", "v2"], `@added(Versions.v2) union Test {}`);

      strictEqual(v1.kind, "Intrinsic");
      strictEqual((v1 as any as IntrinsicType).name, "never");
      strictEqual(v2.kind, "Union");
    });

    it("can be removed", async () => {
      const {
        projections: [v1, v2],
      } = await versionedUnion(["v1", "v2"], `@removed(Versions.v2) union Test {}`);

      strictEqual(v2.kind, "Intrinsic");
      strictEqual((v2 as any as IntrinsicType).name, "never");
      strictEqual(v1.kind, "Union");
    });

    it("can be renamed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5],
      } = await versionedUnion(
        ["v1", "v2", "v3", "v4", "v5"],
        `
        @renamedFrom(Versions.v2, "a")
        @renamedFrom(Versions.v3, "b")
        @renamedFrom(Versions.v5, "c")
        union Test {}`,
      );
      strictEqual((v1 as Union).name, "a");
      strictEqual((v2 as Union).name, "b");
      strictEqual((v3 as Union).name, "c");
      strictEqual((v4 as Union).name, "c");
      strictEqual((v5 as Union).name, "Test");
    });

    it("can be added/removed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5, v6],
      } = await versionedUnion(
        ["v1", "v2", "v3", "v4", "v5", "v6"],
        `
        @added(Versions.v2)
        @removed(Versions.v3)
        @added(Versions.v5)
        @removed(Versions.v6)
        union Test {}`,
      );
      strictEqual(v1.kind, "Intrinsic");
      strictEqual((v1 as any as IntrinsicType).name, "never");
      strictEqual(v2.kind, "Union");
      strictEqual((v2 as Union).name, "Test");
      strictEqual(v3.kind, "Intrinsic");
      strictEqual((v3 as any as IntrinsicType).name, "never");
      strictEqual(v4.kind, "Intrinsic");
      strictEqual((v4 as any as IntrinsicType).name, "never");
      strictEqual(v5.kind, "Union");
      strictEqual((v5 as Union).name, "Test");
      strictEqual(v6.kind, "Intrinsic");
      strictEqual((v6 as any as IntrinsicType).name, "never");
    });

    it("does not emit diagnostic when using named versioned union variant in incompatible versioned source", async () => {
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        namespace TestService {
          enum Versions {v1, v2}

          @added(Versions.v2)
          model Versioned {}

          union NamedUnion {
            string;

            @added(Versions.v2)
            Versioned;
          }
          
          @added(Versions.v1)
          model Foo {
            content: NamedUnion;
          }
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    async function versionedUnion(versions: string[], union: string) {
      const { Test } = (await runner.compile(`
      @versioned(Versions)
      namespace MyService;

      enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

      @test ${union}
      `)) as { Test: Union };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("union variants", () => {
    it("can be added", async () => {
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
        `,
      );
      assertHasVariants(v1, ["a"]);

      assertHasVariants(v2, ["a", "b", "nested"]);
      assertHasProperties(v2.variants.get("nested")!.type as Model, ["d"]);
      assertHasVariants(v3, ["a", "b", "c", "nested"]);
      assertHasProperties(v3.variants.get("nested")!.type as Model, ["d", "e"]);
      assertUnionProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
        ],
        source,
      );
    });

    it("can be removed", async () => {
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
        `,
      );
      assertHasVariants(v1, ["a", "b", "c", "nested"]);
      assertHasProperties(v1.variants.get("nested")!.type as Model, ["d", "e"]);
      assertHasVariants(v2, ["a", "c", "nested"]);
      assertHasProperties(v2.variants.get("nested")!.type as Model, ["d"]);
      assertHasVariants(v3, ["a"]);
      assertUnionProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
          [v3, "v3"],
        ],
        source,
      );
    });

    it("can be renamed", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedUnion(
        ["v1", "v2", "v3"],
        `union Test {
          a: int32;
          @renamedFrom(Versions.v2, "foo") b: int32;
          @renamedFrom(Versions.v3, "bar") c: int32;
        }`,
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
        source,
      );
    });

    it("can be renamed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5],
      } = await versionedUnion(
        ["v1", "v2", "v3", "v4", "v5"],
        `
        union Test {
          @renamedFrom(Versions.v2, "a")
          @renamedFrom(Versions.v3, "b")
          @renamedFrom(Versions.v5, "c")
          d: int32;
        }`,
      );
      assertHasVariants(v1, ["a"]);
      assertHasVariants(v2, ["b"]);
      assertHasVariants(v3, ["c"]);
      assertHasVariants(v4, ["c"]);
      assertHasVariants(v5, ["d"]);
    });

    it("emits diagnostic when renaming causes duplicates", async () => {
      const code = `
      @versioned(Versions)
      @service({
        title: "Widget Service",
      })
      namespace DemoService;

      enum Versions {
        "v1",
        "v2",
      }

      union BadUnion {
        color: string,
        @renamedFrom(Versions.v2, "color") shade: string;
      }      
      `;
      const diagnostics = await runner.diagnose(code);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/renamed-duplicate-property",
        message:
          "Property 'color' marked with '@renamedFrom' conflicts with existing property in version v1.",
      });
    });

    it("can be added/removed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5, v6],
      } = await versionedUnion(
        ["v1", "v2", "v3", "v4", "v5", "v6"],
        `
        union Test {
          a: int32;
          @added(Versions.v2)
          @removed(Versions.v3)
          @added(Versions.v5)
          @removed(Versions.v6)  
          b: string;
        }`,
      );
      assertHasVariants(v1, ["a"]);
      assertHasVariants(v2, ["a", "b"]);
      assertHasVariants(v3, ["a"]);
      assertHasVariants(v4, ["a"]);
      assertHasVariants(v5, ["a", "b"]);
      assertHasVariants(v6, ["a"]);
    });

    async function versionedUnion(versions: string[], union: string) {
      const { Test } = (await runner.compile(`
      @versioned(Versions)
      namespace MyService;

      enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

      @test ${union}
      `)) as { Test: Union };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("operations", () => {
    it("can be renamed", async () => {
      const {
        projections: [v1, v2],
      } = await versionedOperation(
        ["v1", "v2"],
        `
        @renamedFrom(Versions.v2, "OldTest")
        op Test(): void;`,
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

    it("can be renamed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5],
      } = await versionedOperation(
        ["v1", "v2", "v3", "v4", "v5"],
        `
        @renamedFrom(Versions.v2, "a")
        @renamedFrom(Versions.v3, "b")
        @renamedFrom(Versions.v5, "c")
        op Test(): void;`,
      );
      strictEqual((v1 as Operation).name, "a");
      strictEqual((v2 as Operation).name, "b");
      strictEqual((v3 as Operation).name, "c");
      strictEqual((v4 as Operation).name, "c");
      strictEqual((v5 as Operation).name, "Test");
    });

    it("can be added/removed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5, v6],
      } = await versionedOperation(
        ["v1", "v2", "v3", "v4", "v5", "v6"],
        `
        @added(Versions.v2)
        @removed(Versions.v3)
        @added(Versions.v5)
        @removed(Versions.v6)  
        op Test(): void;`,
      );
      strictEqual(v1.kind, "Intrinsic");
      strictEqual((v1 as any as IntrinsicType).name, "never");
      strictEqual(v2.kind, "Operation");
      strictEqual((v2 as Operation).name, "Test");
      strictEqual(v3.kind, "Intrinsic");
      strictEqual((v3 as any as IntrinsicType).name, "never");
      strictEqual(v4.kind, "Intrinsic");
      strictEqual((v4 as any as IntrinsicType).name, "never");
      strictEqual(v5.kind, "Operation");
      strictEqual((v5 as Operation).name, "Test");
      strictEqual(v6.kind, "Intrinsic");
      strictEqual((v6 as any as IntrinsicType).name, "never");
    });

    async function versionedOperation(versions: string[], operation: string) {
      const { Test } = (await runner.compile(`
        @versioned(Versions)
        namespace MyService;

        enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

        @test ${operation}
      `)) as { Test: Operation };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("operation parameters", () => {
    it("can be added", async () => {
      const {
        projections: [v1, v2],
      } = await versionedOperation(["v1", "v2"], `op Test(@added(Versions.v2) a: string): void;`);

      assertHasProperties(v1.parameters, []);
      assertHasProperties(v2.parameters, ["a"]);
    });

    it("can be added on the same version the underlying model is added", async () => {
      const { MyService } = (await runner.compile(
        `
        @test("MyService")
        @versioned(Versions)
        namespace MyService;

        enum Versions { v1, v2 };

        @added(Versions.v1)
        op create(body: Widget, @added(Versions.v2) newThing: NewThing): Widget;

        model Widget {
          @key id: string;
          @added(Versions.v2) name: string;
        }
  
        @added(Versions.v2)
        model NewThing {
          name: string;
        }
        `,
      )) as { MyService: Namespace };

      runProjections(runner.program, MyService);
    });

    it("can share a model reference between operations with different versions", async () => {
      const code = `
        @test("MyService")
        @versioned(Versions)
        namespace MyService;

        enum Versions { v1, v2, v3 };
        
        model Foo {
          prop: string;
        }
        
        model Parameters {
          name: string;
        
          @added(Versions.v2)
          age: Foo;
        }
        
        @added(Versions.v1)
        op oldOp(...Parameters): void;
        
        @added(Versions.v3)
        op newOp(...Parameters): void;
        `;
      ok(await runner.compile(code));
    });

    it("can be removed", async () => {
      const {
        projections: [v1, v2],
      } = await versionedOperation(["v1", "v2"], `op Test(@removed(Versions.v2) a: string): void;`);

      assertHasProperties(v1.parameters, ["a"]);
      assertHasProperties(v2.parameters, []);
    });

    it("can be renamed", async () => {
      const {
        projections: [v1, v2],
      } = await versionedOperation(
        ["v1", "v2"],
        `op Test(@renamedFrom(Versions.v2, "a") b: string): void;`,
      );

      assertHasProperties(v1.parameters, ["a"]);
      assertHasProperties(v2.parameters, ["b"]);
    });

    it("can be renamed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5],
      } = await versionedOperation(
        ["v1", "v2", "v3", "v4", "v5"],
        `op Test(
          @renamedFrom(Versions.v2, "a")
          @renamedFrom(Versions.v3, "b")
          @renamedFrom(Versions.v5, "c")
          d: string
        ): void;`,
      );
      assertHasProperties(v1.parameters, ["a"]);
      assertHasProperties(v2.parameters, ["b"]);
      assertHasProperties(v3.parameters, ["c"]);
      assertHasProperties(v4.parameters, ["c"]);
      assertHasProperties(v5.parameters, ["d"]);
    });

    it("can be added/removed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5, v6],
      } = await versionedOperation(
        ["v1", "v2", "v3", "v4", "v5", "v6"],
        `op Test(
          @added(Versions.v2)
          @removed(Versions.v3)
          @added(Versions.v5)
          @removed(Versions.v6)
          a: string
        ): void;`,
      );
      assertHasProperties(v1.parameters, []);
      assertHasProperties(v2.parameters, ["a"]);
      assertHasProperties(v3.parameters, []);
      assertHasProperties(v4.parameters, []);
      assertHasProperties(v5.parameters, ["a"]);
      assertHasProperties(v6.parameters, []);
    });

    it("can change type over multiple versions", async () => {
      const {
        projections: [v1, v2, v3, v4, v5],
      } = await versionedOperation(
        ["v1", "v2", "v3", "v4", "v5"],
        `op Test(
          @typeChangedFrom(Versions.v2, string)
          @typeChangedFrom(Versions.v4, utcDateTime)
          date: int64
        ): void;`,
      );

      strictEqual((v1.parameters.properties.get("date")?.type as Scalar).name, "string");
      strictEqual((v2.parameters.properties.get("date")?.type as Scalar).name, "utcDateTime");
      strictEqual((v3.parameters.properties.get("date")?.type as Scalar).name, "utcDateTime");
      strictEqual((v4.parameters.properties.get("date")?.type as Scalar).name, "int64");
      strictEqual((v5.parameters.properties.get("date")?.type as Scalar).name, "int64");
    });

    it("can be made optional", async () => {
      const {
        projections: [v1, v2],
      } = await versionedOperation(
        ["v1", "v2"],
        `op Test(a: string, @madeOptional(Versions.v2) b?: string): void;`,
      );

      const prop1 = [...v1.parameters.properties.values()];
      const prop2 = [...v2.parameters.properties.values()];
      deepStrictEqual(
        prop1.map((x) => x.optional),
        [false, false],
      );
      deepStrictEqual(
        prop2.map((x) => x.optional),
        [false, true],
      );
    });

    async function versionedOperation(versions: string[], operation: string) {
      const { Test } = (await runner.compile(`
        @versioned(Versions)
        namespace MyService;

        enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

        @test ${operation}
      `)) as { Test: Operation };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("operation return type", () => {
    it("can be added", async () => {
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
        `,
      );

      assertHasVariants(v1.returnType as Union, ["a"]);
      assertHasVariants(v2.returnType as Union, ["a", "b"]);
    });

    it("can be removed", async () => {
      const {
        projections: [v1, v2],
      } = await versionedOperation(
        ["v1", "v2"],
        `
        op Test(): ReturnTypes;
        union ReturnTypes {
          a: string;
          @removed(Versions.v2) b: int32;
        }
        `,
      );

      assertHasVariants(v1.returnType as Union, ["a", "b"]);
      assertHasVariants(v2.returnType as Union, ["a"]);
    });

    it("can be renamed", async () => {
      const {
        projections: [v1, v2],
      } = await versionedOperation(
        ["v1", "v2"],
        `
        op Test(): ReturnTypes;
        union ReturnTypes {
          a: string;
          @renamedFrom(Versions.v2, "b") c: int32;
        }
        `,
      );

      assertHasVariants(v1.returnType as Union, ["a", "b"]);
      assertHasVariants(v2.returnType as Union, ["a", "c"]);
    });

    it("can be renamed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5],
      } = await versionedOperation(
        ["v1", "v2", "v3", "v4", "v5"],
        `
        op Test(): ReturnTypes;
        union ReturnTypes {
          @renamedFrom(Versions.v2, "a")
          @renamedFrom(Versions.v3, "b")
          @renamedFrom(Versions.v5, "c")
          d: int32;
          err: string;
        }`,
      );
      assertHasVariants(v1.returnType as Union, ["a", "err"]);
      assertHasVariants(v2.returnType as Union, ["b", "err"]);
      assertHasVariants(v3.returnType as Union, ["c", "err"]);
      assertHasVariants(v4.returnType as Union, ["c", "err"]);
      assertHasVariants(v5.returnType as Union, ["d", "err"]);
    });

    it("can be added/removed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5, v6],
      } = await versionedOperation(
        ["v1", "v2", "v3", "v4", "v5", "v6"],
        `
        op Test(): ReturnTypes;
        union ReturnTypes {
          a: int32;
          @added(Versions.v2)
          @removed(Versions.v3)
          @added(Versions.v5)
          @removed(Versions.v6)  
          b: string;
        }`,
      );
      assertHasVariants(v1.returnType as Union, ["a"]);
      assertHasVariants(v2.returnType as Union, ["a", "b"]);
      assertHasVariants(v3.returnType as Union, ["a"]);
      assertHasVariants(v4.returnType as Union, ["a"]);
      assertHasVariants(v5.returnType as Union, ["a", "b"]);
      assertHasVariants(v6.returnType as Union, ["a"]);
    });

    it("can change type", async () => {
      const {
        projections: [v1, v2, v3],
      } = await versionedOperation(
        ["v1", "v2", "v3"],
        `
        @returnTypeChangedFrom(Versions.v2, string)
        @returnTypeChangedFrom(Versions.v3, utcDateTime)  
        op Test(): MyDate;

        model MyDate {};
        `,
      );
      ok((v1.returnType as Scalar).name === "string");
      ok((v2.returnType as Scalar).name === "utcDateTime");
      ok((v3.returnType as Model).name === "MyDate");
    });

    async function versionedOperation(versions: string[], operation: string) {
      const { Test } = (await runner.compile(`
        @versioned(Versions)
        namespace MyService;

        enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

        @test ${operation}
      `)) as { Test: Operation };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("interfaces", () => {
    it("can be renamed", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedInterface(
        ["v1", "v2"],
        `
        @renamedFrom(Versions.v2, "OldTest")
        interface Test { }`,
      );

      strictEqual(v1.name, "OldTest");
      strictEqual(v2.name, "Test");
      assertInterfaceProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source,
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

    it("can be renamed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5],
      } = await versionedInterface(
        ["v1", "v2", "v3", "v4", "v5"],
        `
        @renamedFrom(Versions.v2, "a")
        @renamedFrom(Versions.v3, "b")
        @renamedFrom(Versions.v5, "c")
        interface Test {}`,
      );
      strictEqual((v1 as Interface).name, "a");
      strictEqual((v2 as Interface).name, "b");
      strictEqual((v3 as Interface).name, "c");
      strictEqual((v4 as Interface).name, "c");
      strictEqual((v5 as Interface).name, "Test");
    });

    it("can be added/removed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5, v6],
      } = await versionedInterface(
        ["v1", "v2", "v3", "v4", "v5", "v6"],
        `
        @added(Versions.v2)
        @removed(Versions.v3)
        @added(Versions.v5)
        @removed(Versions.v6)  
        interface Test {}`,
      );
      strictEqual(v1.kind, "Intrinsic");
      strictEqual((v1 as any as IntrinsicType).name, "never");
      strictEqual(v2.kind, "Interface");
      strictEqual((v2 as Interface).name, "Test");
      strictEqual(v3.kind, "Intrinsic");
      strictEqual((v3 as any as IntrinsicType).name, "never");
      strictEqual(v4.kind, "Intrinsic");
      strictEqual((v4 as any as IntrinsicType).name, "never");
      strictEqual(v5.kind, "Interface");
      strictEqual((v5 as Interface).name, "Test");
      strictEqual(v6.kind, "Intrinsic");
      strictEqual((v6 as any as IntrinsicType).name, "never");
    });

    async function versionedInterface(versions: string[], iface: string) {
      const { Test } = (await runner.compile(`
        @versioned(Versions)
        namespace MyService;

        enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

        @test ${iface}
      `)) as { Test: Interface };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("interface members", () => {
    it("can be added", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedInterface(
        ["v1", "v2"],
        `interface Test {
        @added(Versions.v2) foo(): void;
      }`,
      );

      assertHasOperations(v1, []);
      assertHasOperations(v2, ["foo"]);
      assertInterfaceProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source,
      );
    });

    it("can be removed", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedInterface(
        ["v1", "v2"],
        `interface Test {
        @removed(Versions.v2) foo(): void;
      }`,
      );

      assertHasOperations(v1, ["foo"]);
      assertHasOperations(v2, []);
      assertInterfaceProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source,
      );
    });

    it("can be removed respecting interface versioning", async () => {
      const {
        source,
        projections: [v2, v3, v4],
      } = await versionedInterface(
        ["v2", "v3", "v4"],
        `@added(Versions.v2)
        interface Test {
          allVersions(): void;
          @removed(Versions.v3) 
          @added(Versions.v4)
          foo(): void;
        }
        `,
      );
      assertHasOperations(v2, ["allVersions", "foo"]);
      assertHasOperations(v3, ["allVersions"]);
      assertHasOperations(v4, ["allVersions", "foo"]);
      assertInterfaceProjectsTo(
        [
          [v2, "v2"],
          [v3, "v3"],
          [v4, "v4"],
        ],
        source,
      );
    });

    it("can be renamed", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedInterface(
        ["v1", "v2"],
        `interface Test {
        @renamedFrom(Versions.v2, "foo") bar(): void;
      }`,
      );

      assertHasOperations(v1, ["foo"]);
      assertHasOperations(v2, ["bar"]);
      assertInterfaceProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source,
      );
    });

    it("can be renamed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5],
      } = await versionedInterface(
        ["v1", "v2", "v3", "v4", "v5"],
        `interface Test {
          @renamedFrom(Versions.v2, "a")
          @renamedFrom(Versions.v3, "b")
          @renamedFrom(Versions.v5, "c")
          op Test(): void;
        }`,
      );
      assertHasOperations(v1, ["a"]);
      assertHasOperations(v2, ["b"]);
      assertHasOperations(v3, ["c"]);
      assertHasOperations(v4, ["c"]);
      assertHasOperations(v5, ["Test"]);
    });

    it("can be added/removed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5, v6],
      } = await versionedInterface(
        ["v1", "v2", "v3", "v4", "v5", "v6"],
        `interface Test {
          @added(Versions.v2)
          @removed(Versions.v3)
          @added(Versions.v5)
          @removed(Versions.v6)  
          op Test(): void;
        }`,
      );
      assertHasOperations(v1, []);
      assertHasOperations(v2, ["Test"]);
      assertHasOperations(v3, []);
      assertHasOperations(v4, []);
      assertHasOperations(v5, ["Test"]);
      assertHasOperations(v6, []);
    });

    it("can change return type", async () => {
      const {
        projections: [v1, v2, v3],
      } = await versionedInterface(
        ["v1", "v2", "v3"],
        `
        interface Test {
          @returnTypeChangedFrom(Versions.v2, string)
          @returnTypeChangedFrom(Versions.v3, utcDateTime)  
          op foo(): MyDate;  
        }

        model MyDate {};
        `,
      );
      ok((v1.operations.get("foo")!.returnType as Scalar).name === "string");
      ok((v2.operations.get("foo")!.returnType as Scalar).name === "utcDateTime");
      ok((v3.operations.get("foo")!.returnType as Model).name === "MyDate");
    });

    async function versionedInterface(versions: string[], iface: string) {
      const { Test } = (await runner.compile(`
        @versioned(Versions)
        namespace MyService;

        enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

        @test ${iface}
      `)) as { Test: Interface };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("interface member parameters", () => {
    it("can be added", async () => {
      const {
        projections: [v1, v2],
      } = await versionedInterface(
        ["v1", "v2"],
        `interface Test { 
          op foo(@added(Versions.v2) a: string): void;
        }`,
      );

      assertHasProperties(v1.operations.get("foo")!.parameters, []);
      assertHasProperties(v2.operations.get("foo")!.parameters, ["a"]);
    });

    it("can be removed", async () => {
      const {
        projections: [v1, v2],
      } = await versionedInterface(
        ["v1", "v2"],
        `interface Test {
        op foo(@removed(Versions.v2) a: string): void;
      }`,
      );

      assertHasProperties(v1.operations.get("foo")!.parameters, ["a"]);
      assertHasProperties(v2.operations.get("foo")!.parameters, []);
    });

    it("can be renamed", async () => {
      const {
        projections: [v1, v2],
      } = await versionedInterface(
        ["v1", "v2"],
        `interface Test {
          op foo(@renamedFrom(Versions.v2, "a") b: string): void;
        }`,
      );

      assertHasProperties(v1.operations.get("foo")!.parameters, ["a"]);
      assertHasProperties(v2.operations.get("foo")!.parameters, ["b"]);
    });

    it("can be renamed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5],
      } = await versionedInterface(
        ["v1", "v2", "v3", "v4", "v5"],
        `interface Test {
          op foo(
            @renamedFrom(Versions.v2, "a")
            @renamedFrom(Versions.v3, "b")
            @renamedFrom(Versions.v5, "c")
            d: string
          ): void;
        }`,
      );
      assertHasProperties(v1.operations.get("foo")!.parameters, ["a"]);
      assertHasProperties(v2.operations.get("foo")!.parameters, ["b"]);
      assertHasProperties(v3.operations.get("foo")!.parameters, ["c"]);
      assertHasProperties(v4.operations.get("foo")!.parameters, ["c"]);
      assertHasProperties(v5.operations.get("foo")!.parameters, ["d"]);
    });

    it("can be added/removed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5, v6],
      } = await versionedInterface(
        ["v1", "v2", "v3", "v4", "v5", "v6"],
        `interface Test {
          op foo(
            @added(Versions.v2)
            @removed(Versions.v3)
            @added(Versions.v5)
            @removed(Versions.v6)
            a: string
          ): void;
        }`,
      );
      assertHasProperties(v1.operations.get("foo")!.parameters, []);
      assertHasProperties(v2.operations.get("foo")!.parameters, ["a"]);
      assertHasProperties(v3.operations.get("foo")!.parameters, []);
      assertHasProperties(v4.operations.get("foo")!.parameters, []);
      assertHasProperties(v5.operations.get("foo")!.parameters, ["a"]);
      assertHasProperties(v6.operations.get("foo")!.parameters, []);
    });

    async function versionedInterface(versions: string[], iface: string) {
      const { Test } = (await runner.compile(`
        @versioned(Versions)
        namespace MyService;

        enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

        @test ${iface}
      `)) as { Test: Interface };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("enums", () => {
    it("can be renamed", async () => {
      const {
        source,
        projections: [v1, v2],
      } = await versionedEnum(
        ["v1", "v2"],
        `
        @renamedFrom(Versions.v2, "OldTest")
        enum Test { }`,
      );

      strictEqual(v1.name, "OldTest");
      strictEqual(v2.name, "Test");
      assertEnumProjectsTo(
        [
          [v1, "v1"],
          [v2, "v2"],
        ],
        source,
      );
    });

    it("can be added", async () => {
      const {
        projections: [v1, v2],
      } = await versionedEnum(["v1", "v2"], `@added(Versions.v2) enum Test {}`);
      strictEqual(v1.kind, "Intrinsic");
      strictEqual((v1 as any as IntrinsicType).name, "never");
      strictEqual(v2.kind, "Enum");
    });

    it("can be removed", async () => {
      const {
        projections: [v1, v2],
      } = await versionedEnum(["v1", "v2"], `@removed(Versions.v2) enum Test {}`);

      strictEqual(v1.kind, "Enum");
      strictEqual(v2.kind, "Intrinsic");
      strictEqual((v2 as any as IntrinsicType).name, "never");
    });

    it("can be renamed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5],
      } = await versionedEnum(
        ["v1", "v2", "v3", "v4", "v5"],
        `
        @renamedFrom(Versions.v2, "a")
        @renamedFrom(Versions.v3, "b")
        @renamedFrom(Versions.v5, "c")
        enum Test {}`,
      );
      strictEqual((v1 as Enum).name, "a");
      strictEqual((v2 as Enum).name, "b");
      strictEqual((v3 as Enum).name, "c");
      strictEqual((v4 as Enum).name, "c");
      strictEqual((v5 as Enum).name, "Test");
    });

    it("can be added/removed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5, v6],
      } = await versionedEnum(
        ["v1", "v2", "v3", "v4", "v5", "v6"],
        `
        @added(Versions.v2)
        @removed(Versions.v3)
        @added(Versions.v5)
        @removed(Versions.v6)
        enum Test {}`,
      );
      strictEqual(v1.kind, "Intrinsic");
      strictEqual((v1 as any as IntrinsicType).name, "never");
      strictEqual(v2.kind, "Enum");
      strictEqual((v2 as Enum).name, "Test");
      strictEqual(v3.kind, "Intrinsic");
      strictEqual((v3 as any as IntrinsicType).name, "never");
      strictEqual(v4.kind, "Intrinsic");
      strictEqual((v4 as any as IntrinsicType).name, "never");
      strictEqual(v5.kind, "Enum");
      strictEqual((v5 as Enum).name, "Test");
      strictEqual(v6.kind, "Intrinsic");
      strictEqual((v6 as any as IntrinsicType).name, "never");
    });

    async function versionedEnum(versions: string[], enumCode: string) {
      const { Test } = (await runner.compile(`
        @versioned(Versions)
        namespace MyService;

        enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

        @test ${enumCode}
      `)) as { Test: Enum };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("enum members", () => {
    it("can be added", async () => {
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
        `,
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
        source,
      );
    });

    it("can be removed", async () => {
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
        `,
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
        source,
      );
    });

    it("can be renamed", async () => {
      const {
        source,
        projections: [v1, v2, v3],
      } = await versionedEnum(
        ["v1", "v2", "v3"],
        `enum Test {
          a: 1;
          @renamedFrom(Versions.v2, "foo") b: 2;
          @renamedFrom(Versions.v3, "bar") c: 3;
        }`,
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
        source,
      );
    });

    it("can be renamed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5],
      } = await versionedEnum(
        ["v1", "v2", "v3", "v4", "v5"],
        `
        enum Test {
          @renamedFrom(Versions.v2, "a")
          @renamedFrom(Versions.v3, "b")
          @renamedFrom(Versions.v5, "c")
          d: 1;
        }`,
      );
      assertHasMembers(v1, ["a"]);
      assertHasMembers(v2, ["b"]);
      assertHasMembers(v3, ["c"]);
      assertHasMembers(v4, ["c"]);
      assertHasMembers(v5, ["d"]);
    });

    it("emits diagnostic when renaming causes duplicates", async () => {
      const code = `
      @versioned(Versions)
      @service({
        title: "Widget Service",
      })
      namespace DemoService;

      enum Versions {
        "v1",
        "v2",
      }
      
      enum BadEnum {
        color,
        @renamedFrom(Versions.v2, "color") shade;
      }
      `;
      const diagnostics = await runner.diagnose(code);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/renamed-duplicate-property",
        message:
          "Property 'color' marked with '@renamedFrom' conflicts with existing property in version v1.",
      });
    });

    it("can be added/removed multiple times", async () => {
      const {
        projections: [v1, v2, v3, v4, v5, v6],
      } = await versionedEnum(
        ["v1", "v2", "v3", "v4", "v5", "v6"],
        `
        enum Test {
          a: 1;
          @added(Versions.v2)
          @removed(Versions.v3)
          @added(Versions.v5)
          @removed(Versions.v6)  
          b: 2;
        }`,
      );
      assertHasMembers(v1, ["a"]);
      assertHasMembers(v2, ["a", "b"]);
      assertHasMembers(v3, ["a"]);
      assertHasMembers(v4, ["a"]);
      assertHasMembers(v5, ["a", "b"]);
      assertHasMembers(v6, ["a"]);
    });

    async function versionedEnum(versions: string[], enumCode: string) {
      const { Test } = (await runner.compile(`
        @versioned(Versions)
        namespace MyService;

        enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

        @test ${enumCode}
      `)) as { Test: Enum };

      return {
        source: Test,
        projections: versions.map((v) => {
          return project(Test, v);
        }),
      };
    }
  });

  describe("scalars", () => {
    it("can be renamed", async () => {
      const {
        projections: [v1, v2],
      } = await versionedScalar(
        ["v1", "v2"],
        `
        @renamedFrom(Versions.v2, "oldTest")
        scalar test;`,
      );

      strictEqual(v1.name, "oldTest");
      strictEqual(v2.name, "test");
    });

    it("can be added", async () => {
      const {
        projections: [v1, v2],
      } = await versionedScalar(["v1", "v2"], `@added(Versions.v2) scalar test;`);
      strictEqual(v1.kind, "Intrinsic");
      strictEqual((v1 as any as IntrinsicType).name, "never");
      strictEqual(v2.kind, "Scalar");
    });

    it("can be removed", async () => {
      const {
        projections: [v1, v2],
      } = await versionedScalar(["v1", "v2"], `@removed(Versions.v2) scalar test;`);

      strictEqual(v1.kind, "Scalar");
      strictEqual(v2.kind, "Intrinsic");
      strictEqual((v2 as any as IntrinsicType).name, "never");
    });

    async function versionedScalar(versions: string[], scalarCode: string) {
      const { test } = (await runner.compile(`
        @versioned(Versions)
        namespace MyService;

        enum Versions { ${versions.map((t) => JSON.stringify(t)).join(" , ")} }

        @test ${scalarCode}
      `)) as { test: Scalar };

      return {
        source: test,
        projections: versions.map((v) => {
          return project(test, v);
        }),
      };
    }
  });

  function assertModelProjectsTo(types: [Model, string][], target: Model) {
    types.forEach(([m, version]) => {
      const projection = project(m, version, "from");
      strictEqual(projection.properties.size, target.properties.size);
      for (const prop of projection.properties.values()) {
        ok(target.properties.has(prop.name));
      }
    });
  }

  function assertUnionProjectsTo(types: [Union, string][], target: Union) {
    types.forEach(([m, version]) => {
      const projection = project(m, version, "from");
      strictEqual(projection.variants.size, target.variants.size);
      for (const prop of projection.variants.values()) {
        ok(target.variants.has(prop.name));
      }
    });
  }
  function assertInterfaceProjectsTo(types: [Interface, string][], target: Interface) {
    types.forEach(([m, version]) => {
      const projection = project(m, version, "from");
      strictEqual(projection.operations.size, target.operations.size);
      for (const prop of projection.operations.values()) {
        ok(target.operations.has(prop.name), "source interface should have operation " + prop.name);
      }
    });
  }
  function assertEnumProjectsTo(types: [Enum, string][], target: Enum) {
    types.forEach(([m, version]) => {
      const projection = project(m, version, "from");
      strictEqual(projection.members.size, target.members.size);
      for (const member of projection.members.values()) {
        ok(target.members.has(member.name), "enum should have operation " + member.name);
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
    const versionMap = new Map<Namespace, Version>([[actualVersion.namespace, actualVersion]]);
    const timeline = new VersioningTimeline(runner.program, [versionMap]);
    const versionKey = indexTimeline(runner.program, timeline, timeline.get(actualVersion));
    const projection: ProjectionApplication = {
      arguments: [versionKey],
      projectionName: "v",
      direction,
    };
    const projector = projectProgram(runner.program, [projection], target).projector;
    return projector.projectedTypes.get(target) as T;
  }
});
function runProjections(program: Program, rootNs: Namespace) {
  const versions = buildVersionProjections(program, rootNs);
  const projectedPrograms = versions.map((x) => projectProgram(program, x.projections));
  projectedPrograms.forEach((p) => expectDiagnosticEmpty(p.diagnostics));
  return projectedPrograms.map((p) => p.projector);
}
