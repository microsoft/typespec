import { ModelType, NamespaceType } from "@cadl-lang/compiler";
import { BasicTestRunner, createTestWrapper, expectDiagnostics } from "@cadl-lang/compiler/testing";
import { ok, strictEqual } from "assert";
import { getVersionRecords } from "../src/versioning.js";
import { createVersioningTestHost } from "./test-host.js";

describe("cadl: versioning: depdendencies", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    const host = await createVersioningTestHost();
    runner = createTestWrapper(
      host,
      (code) => `
      import "@cadl-lang/versioning";

      @versioned("1" | "2")
      namespace VersionedLib {
        model Foo {
          name: string;
          @added("2") age: int32;
        }
      }
      ${code}`
    );
  });

  function assertFooV1(foo: ModelType) {
    ok(foo.properties.has("name"));
    ok(!foo.properties.has("age"), "Age was added in version 2 and version 1 was selected.");
  }

  function assertFooV2(Foo: ModelType) {
    ok(Foo.properties.has("name"));
    ok(Foo.properties.has("age"), "Age was added in version 2 and version 1 was selected.");
  }

  describe("when project is not-versioned", () => {
    it("use a versioned library given version", async () => {
      const { MyService, Test } = (await runner.compile(`
        @versionedDependency(VersionedLib, "1")
        @test namespace MyService {
          @test model Test extends VersionedLib.Foo {}
        } 
    `)) as { MyService: NamespaceType; Test: ModelType };
      const versions = getVersionRecords(runner.program, MyService);
      strictEqual(versions.length, 1);
      strictEqual(versions[0].version, undefined);
      strictEqual(versions[0].projections.length, 1);

      const projector = runner.program.enableProjections(versions[0].projections, Test);
      const Foo = (projector.projectedTypes.get(Test) as any).baseModel;

      assertFooV1(Foo);
    });

    it("emit diagnostic if passing version mapping", async () => {
      const diagnostics = await runner.diagnose(`
        @versionedDependency(VersionedLib, {v1: "1", v2: "2"})
        namespace MyService {
          model Test extends VersionedLib.Foo {}
        } 
    `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/versioned-dependency-not-string",
        message:
          "The versionedDependency decorator must provide a version of the dependency 'VersionedLib'.",
      });
    });
  });

  describe("when project is versioned", () => {
    it("use a versioned library given version", async () => {
      const { MyService, Test } = (await runner.compile(`
        @versioned("v1" | "v2")
        @versionedDependency(VersionedLib, {v1: "1", v2: "2"})
        @test namespace MyService {
          @test model Test extends VersionedLib.Foo {}
        } 
    `)) as { MyService: NamespaceType; Test: ModelType };
      const versions = getVersionRecords(runner.program, MyService);
      strictEqual(versions.length, 2);
      strictEqual(versions[0].version, "v1");
      strictEqual(versions[1].version, "v2");

      const projectorV1 = runner.program.enableProjections(versions[0].projections, Test);
      const FooV1 = (projectorV1.projectedTypes.get(Test) as any).baseModel;

      assertFooV1(FooV1);

      const projectorV2 = runner.program.enableProjections(versions[1].projections, Test);
      const FooV2 = (projectorV2.projectedTypes.get(Test) as any).baseModel;
      assertFooV2(FooV2);
    });

    it("emit diagnostic if passing a specific version", async () => {
      const diagnostics = await runner.diagnose(`
        @versioned("v1" | "v2")
        @versionedDependency(VersionedLib, "1")
        namespace MyService {
          model Test extends VersionedLib.Foo {}
        } 
    `);
      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/versioning/versioned-dependency-record-not-model",
        message:
          "The versionedDependency decorator must provide a model mapping local versions to dependency 'VersionedLib' versions",
      });
    });
  });
});
