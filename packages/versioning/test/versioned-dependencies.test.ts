import type { Model, Namespace, Operation, Program } from "@typespec/compiler";
import { projectProgram } from "@typespec/compiler";
import {
  createTestWrapper,
  expectDiagnosticEmpty,
  expectDiagnostics,
  type BasicTestRunner,
} from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { buildVersionProjections } from "../src/projection.js";
import { createVersioningTestHost, createVersioningTestRunner } from "./test-host.js";
import { assertHasProperties } from "./utils.js";

describe("versioning: reference versioned library", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    const host = await createVersioningTestHost();
    runner = createTestWrapper(host, {
      wrapper: (code) => `
      import "@typespec/versioning";
      using TypeSpec.Versioning;
      @versioned(Versions)
      namespace VersionedLib {
        enum Versions {l1, l2}
        model Foo {
          name: string;
          @added(Versions.l2) age: int32;
        }

        @removed(Versions.l2)
        op Operation<TParams, TResponse>(...TParams): TResponse;
      }
      ${code}`,
    });
  });

  function assertFooV1(foo: Model) {
    ok(foo.properties.has("name"));
    ok(!foo.properties.has("age"), "Age was added in version 2 and version 1 was selected.");
  }

  function assertFooV2(Foo: Model) {
    ok(Foo.properties.has("name"));
    ok(Foo.properties.has("age"), "Age was added in version 2 and version 1 was selected.");
  }

  describe("when project is not-versioned", () => {
    it("use a versioned library given version", async () => {
      const { MyService, Test } = (await runner.compile(`
        @useDependency(VersionedLib.Versions.l1)
        @test namespace MyService {
          @test model Test extends VersionedLib.Foo {}
          @test op test1 is VersionedLib.Operation<{name: string}, int32>;
          alias test2 = VersionedLib.Operation<{name: string}, int32>;
        } 
    `)) as { MyService: Namespace; Test: Model };
      const versions = buildVersionProjections(runner.program, MyService);
      strictEqual(versions.length, 1);
      strictEqual(versions[0].version, undefined);
      strictEqual(versions[0].projections.length, 1);

      const projector = projectProgram(runner.program, versions[0].projections, Test).projector;
      const Foo = (projector.projectedTypes.get(Test) as any).baseModel;

      assertFooV1(Foo);
    });

    it("use multiple versioned libraries given version", async () => {
      const { MyService, Test, getBar } = (await runner.compile(`
        @versioned(Versions)
        namespace OtherVersionedLib {
          enum Versions {
            m1,
          }
          model Bar {};
        }
        @useDependency(VersionedLib.Versions.l1, OtherVersionedLib.Versions.m1)
        @test namespace MyService {
          @test model Test extends VersionedLib.Foo {}
          
          @test op getBar(): OtherVersionedLib.Bar;
          @test op test1 is VersionedLib.Operation<{name: string}, int32>;
          alias test2 = VersionedLib.Operation<{name: string}, int32>;
        } 
    `)) as { MyService: Namespace; Test: Model; getBar: Operation };
      const versions = buildVersionProjections(runner.program, MyService);
      strictEqual(versions.length, 1);
      strictEqual(versions[0].version, undefined);
      strictEqual(versions[0].projections.length, 1);

      const projector = projectProgram(runner.program, versions[0].projections, Test).projector;
      const Foo = (projector.projectedTypes.get(Test) as any).baseModel;

      assertFooV1(Foo);
      ok((getBar.returnType as Model).name === "Bar");
      ok((getBar.returnType as Model).namespace?.name === "OtherVersionedLib");
    });

    it("emit diagnostic if passing anything but an enum member", async () => {
      const diagnostics = await runner.diagnose(`
        @useDependency([[VersionedLib.Versions.l1, VersionedLib.Versions.l1]])
        namespace MyService {
          model Test extends VersionedLib.Foo {}
        } 
    `);
      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
      });
    });
  });

  describe("when project is versioned", () => {
    it("use a versioned library given version", async () => {
      const { MyService, Test } = (await runner.compile(`
        @versioned(Versions)
        @test namespace MyService {
          enum Versions {
            @useDependency(VersionedLib.Versions.l1)
            v1,
            @useDependency(VersionedLib.Versions.l2)
            v2
          }
          @test model Test extends VersionedLib.Foo {}
          @test op test1 is VersionedLib.Operation<{name: string}, int32>;
          alias test2 = VersionedLib.Operation<{name: string}, int32>;
        } 
    `)) as { MyService: Namespace; Test: Model };
      const versions = buildVersionProjections(runner.program, MyService);
      strictEqual(versions.length, 2);
      strictEqual(versions[0].version, "v1");
      strictEqual(versions[1].version, "v2");

      const projectorV1 = projectProgram(runner.program, versions[0].projections, Test).projector;
      const FooV1 = (projectorV1.projectedTypes.get(Test) as any).baseModel;

      assertFooV1(FooV1);

      const projectorV2 = projectProgram(runner.program, versions[1].projections, Test).projector;
      const FooV2 = (projectorV2.projectedTypes.get(Test) as any).baseModel;
      assertFooV2(FooV2);
    });

    it("use the same versioned library version for multiple service versions", async () => {
      const { MyService, Test } = (await runner.compile(`
        @versioned(Versions)
        @test namespace MyService {
          enum Versions {
            @useDependency(VersionedLib.Versions.l1)
            v1,
            @useDependency(VersionedLib.Versions.l1)
            v2
          }
          @test model Test extends VersionedLib.Foo {}
          @test op test1 is VersionedLib.Operation<{name: string}, int32>;
          alias test2 = VersionedLib.Operation<{name: string}, int32>;
        } 
    `)) as { MyService: Namespace; Test: Model };
      const versions = buildVersionProjections(runner.program, MyService);
      strictEqual(versions.length, 2);
      strictEqual(versions[0].version, "v1");
      strictEqual(versions[1].version, "v2");

      const projectorV1 = projectProgram(runner.program, versions[0].projections, Test).projector;
      const FooV1 = (projectorV1.projectedTypes.get(Test) as any).baseModel;

      assertFooV1(FooV1);

      const projectorV2 = projectProgram(runner.program, versions[1].projections, Test).projector;
      const FooV2 = (projectorV2.projectedTypes.get(Test) as any).baseModel;
      assertFooV1(FooV2);
    });

    it("emit diagnostic if @useDependency and @versioned are used on a Namespace", async () => {
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        @useDependency(VersionedLib.Versions.l1)
        namespace MyService {
          enum Versions {v1, v2}
          model Test extends VersionedLib.Foo {}
        } 
    `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/incompatible-versioned-namespace-use-dependency",
        message:
          "The useDependency decorator can only be used on a Namespace if the namespace is unversioned. For versioned namespaces, put the useDependency decorator on the version enum members.",
      });
    });

    it("emit diagnostic if @useDependency is used on an enum that isn't in the namespace.", async () => {
      const diagnostics = await runner.diagnose(`
        enum TestServiceVersions {
          @useDependency(VersionedLib.Versions.l1)
          v1,
          @useDependency(VersionedLib.Versions.l2)
          v2,
        }
        @versioned(TestServiceVersions)
        namespace TestService {
          @added(TestServiceVersions.v2)
          op test(): VersionedLib.Foo;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/version-not-found",
        message:
          "The provided version 'v2' from 'TestServiceVersions' is not declared as a version enum. Use '@versioned(TestServiceVersions)' on the containing namespace.",
      });
    });

    it("doesn't emit diagnostic when library template with model expression instantiated with user model", async () => {
      const diagnostics = await runner.diagnose(`
        namespace Library {
        model Template<T> {
            a: {
              b: T;
            };
          }
        }

        @versioned(Versions)
        namespace Api {
          enum Versions { v1 }

          model Model {}

          model Issue is Library.Template<Model>;
        }
    `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("doesn't emit diagnostic when library template with union expression instantiated with user model", async () => {
      const diagnostics = await runner.diagnose(`
        namespace Library {
        model Template<T> {
            a: string | T;
          }
        }

        @versioned(Versions)
        namespace Api {
          enum Versions { v1 }

          model Model {}

          model Issue is Library.Template<Model>;
        }
    `);
      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("when using versioned library without @useDependency", () => {
    it("emit diagnostic when model uses extends", async () => {
      const diagnostics = await runner.diagnose(`
        namespace MyService {
          model Test extends VersionedLib.Foo {}
        } 
    `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/using-versioned-library",
        message:
          "Namespace 'MyService' is referencing types from versioned namespace 'VersionedLib' but didn't specify which versions with @useDependency.",
      });
    });

    it("emit diagnostic when model uses is", async () => {
      const diagnostics = await runner.diagnose(`
        namespace MyService {
          model Test is VersionedLib.Foo {}
        } 
    `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/using-versioned-library",
        message:
          "Namespace 'MyService' is referencing types from versioned namespace 'VersionedLib' but didn't specify which versions with @useDependency.",
      });
    });

    it("emit diagnostic when model uses alias", async () => {
      const diagnostics = await runner.diagnose(`
        namespace MyService {
          alias Test = VersionedLib.Foo;
          op test(): Test;
        } 
    `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/using-versioned-library",
        message:
          "Namespace 'MyService' is referencing types from versioned namespace 'VersionedLib' but didn't specify which versions with @useDependency.",
      });
    });

    it("emit diagnostic when operation uses is", async () => {
      const diagnostics = await runner.diagnose(`
        namespace MyService {
          op test is VersionedLib.Operation<{name: string}, int32>;
        } 
    `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/using-versioned-library",
        message:
          "Namespace 'MyService' is referencing types from versioned namespace 'VersionedLib' but didn't specify which versions with @useDependency.",
      });
    });

    it("emit diagnostic when operation uses alias", async () => {
      const diagnostics = await runner.diagnose(`
        namespace MyService {
          alias test = VersionedLib.Operation<{name: string}, int32>;
          op myTest is test;
        } 
    `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/using-versioned-library",
        message:
          "Namespace 'MyService' is referencing types from versioned namespace 'VersionedLib' but didn't specify which versions with @useDependency.",
      });
    });

    it("emit diagnostic when used in properties", async () => {
      const diagnostics = await runner.diagnose(`
        namespace MyService {
          model Test {
            foo: VersionedLib.Foo
          }
        } 
    `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/using-versioned-library",
        message:
          "Namespace 'MyService' is referencing types from versioned namespace 'VersionedLib' but didn't specify which versions with @useDependency.",
      });
    });

    it("emit diagnostic when project has no namespace", async () => {
      const diagnostics = await runner.diagnose(`
        model Test extends VersionedLib.Foo {}
    `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/using-versioned-library",
        message:
          "Namespace '' is referencing types from versioned namespace 'VersionedLib' but didn't specify which versions with @useDependency.",
      });
    });

    it("doesn't emit diagnostic when versioned library use templated type from non versioned lib", async () => {
      const diagnostics = await runner.diagnose(`
        namespace NonVersioned {
          model Foo<T> {
            foo: T;
          }
        }
        @versioned(Versions)
        namespace MyService {
          enum Versions {v1, v2}
          
          model Bar {}
          model Test extends NonVersioned.Foo<Bar> {}
        } 
    `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("doesn't emit diagnostic when extends interface of non versioned lib", async () => {
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        namespace MyService {
          enum Versions {v1, v2}
          
          model Foo {}
          interface Test {
            test(): Foo;
          }
        } 
    `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("doesn't emit diagnostic using union in non versioned lib", async () => {
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        namespace DemoService {
          enum Versions {v1, v2}
          
          model Foo {}
          interface Test extends NonVersioned.Foo<Foo> {}
        }
        namespace NonVersioned {
          interface Foo<T> {
            foo(): T | {};
          }
        }
    `);
      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("sub namespace of versioned namespace", () => {
    it("doesn't emit diagnostic when parent namespace is versioned and using type from it", async () => {
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        namespace DemoService {
          enum Versions {v1, v2}
          
          model Foo {}
          namespace SubNamespace {
            op use(): Foo;
          }
        }
    `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("doesn't emit diagnostic when referencing different sub namespace", async () => {
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        namespace DemoService {
          enum Versions {v1, v2}
          
          namespace A {
            model Foo {}
          }
          namespace B {
            op use(): A.Foo;
          }
        }
    `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("doesn't emit diagnostic when referencing to versioned library from subnamespace with parent namespace with versioned dependency", async () => {
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        namespace Lib {
          enum Versions {v1, v2}
          
          model Foo {}
        }
        @useDependency(Lib.Versions.v1)
        namespace MyService {
          namespace SubNamespace {
            op use(): Lib.Foo;
          }
        }
    `);
      expectDiagnosticEmpty(diagnostics);
    });

    // LEGACY test due to arm depending on it. Should remove when we relax using-versioned-library rule
    it("doesn't emit diagnostic when parent namespace reference sub namespace that is versioned differently", async () => {
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        namespace MyService {
          enum Versions {m1}
          model Foo is SubNamespace.Bar;
          
          @versioned(SubNamespace.Versions)
          namespace SubNamespace {
            enum Versions { s1 }
            model Bar {}
          }
        }
    `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("succeed if sub namespace of versioned service reference versioned library", async () => {
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        namespace Lib {
          enum Versions {v1, v2}
          
          model Foo {}
        }
        @versioned(Versions)
        namespace MyService {
          enum Versions {
            @useDependency(Lib.Versions.v1)
            m1
          }
          namespace SubNamespace {
            op use(): Lib.Foo;
          }
        }
    `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("succeed if versioned service reference sub namespace type", async () => {
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        namespace MyService {
          enum Versions {m1}
          op use(): SubNamespace.Foo;
          namespace SubNamespace {
            model Foo {}
          }
        }
    `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("succeed reference versioned library sub namespace", async () => {
      const diagnostics = await runner.diagnose(`
        @versioned(Versions)
        namespace Lib {
          enum Versions {v1, v2}
          namespace LibSub {
            model Foo {}
          }
        }
        @versioned(Versions)
        namespace MyService {
          enum Versions {
            @useDependency(Lib.Versions.v1)
            m1
          }
          namespace ServiceSub {
            op use(): Lib.LibSub.Foo;
          }
        }
    `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("emit diagnostic when used in properties of generic type", async () => {
      const diagnostics = await runner.diagnose(`
        namespace MyService {
          model Test<T> {
            t: T;
            foo: VersionedLib.Foo
          }
        } 
    `);
      expectDiagnostics(diagnostics, {
        code: "@typespec/versioning/using-versioned-library",
        message:
          "Namespace 'MyService' is referencing types from versioned namespace 'VersionedLib' but didn't specify which versions with @useDependency.",
      });
    });
  });
});

describe("versioning: dependencies", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createVersioningTestRunner();
  });

  it("use model defined in non versioned library spreading properties", async () => {
    const { MyService, Test } = (await runner.compile(`
      namespace NonVersionedLib {
        model Spread<T> {
          t: string;
          ...T;
        }
      }
      @versioned(Versions)
      @test namespace MyService {
        enum Versions {v1, v2}
        model Spreadable {
          a: int32;
          @added(Versions.v2) b: int32;
        }
        @test model Test extends NonVersionedLib.Spread<Spreadable> {}
      }
      `)) as { MyService: Namespace; Test: Model };

    const [v1, v2] = runProjections(runner.program, MyService);

    const SpreadInstance1 = (v1.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance1, ["t", "a"]);
    const SpreadInstance2 = (v2.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance2, ["t", "a", "b"]);
  });

  it("can spread versioned model from another library", async () => {
    const { MyService, Test } = (await runner.compile(`
      @versioned(Versions)
      namespace VersionedLib {
        enum Versions {l1, l2}
        model Spread<T> {
          t: string;
          ...T;
        }
      }
      @versioned(Versions)
      @test namespace MyService {
        enum Versions {
          @useDependency(VersionedLib.Versions.l1)
          v1,
          @useDependency(VersionedLib.Versions.l2)
          v2
        }
        model Spreadable {
          a: int32;
          @added(Versions.v2) b: int32;
        }
        @test model Test extends VersionedLib.Spread<Spreadable> {}
      }
      `)) as { MyService: Namespace; Test: Model };

    const [v1, v2] = runProjections(runner.program, MyService);

    const SpreadInstance1 = (v1.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance1, ["t", "a"]);
    const SpreadInstance2 = (v2.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance2, ["t", "a", "b"]);
  });

  it("use a templated version in a non-versioned library", async () => {
    const { MyService, Test } = (await runner.compile(`
      namespace NonVersionedLib {
        model VersionedProp<T extends TypeSpec.Reflection.EnumMember> {
          a: string;

          @added(T)
          b: string;
        }
      }
      @versioned(Versions)
      @test namespace MyService {
        enum Versions { v1, v2 }
        @test model Test extends NonVersionedLib.VersionedProp<Versions.v2> {}
      }
      `)) as { MyService: Namespace; Test: Model };

    const [v1, v2] = runProjections(runner.program, MyService);

    const SpreadInstance1 = (v1.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance1, ["a"]);
    const SpreadInstance2 = (v2.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance2, ["a", "b"]);
  });

  it("use a templated version in a versioned library", async () => {
    const { MyService, Test } = (await runner.compile(`
      @versioned(Versions)
      namespace VersionedLib {
        enum Versions {l1, l2}
        model VersionedProp<T extends TypeSpec.Reflection.EnumMember> {
          a: string;

          @added(T)
          b: string;
        }
      }
      @versioned(Versions)
      @test namespace MyService {
        enum Versions {
          @useDependency(VersionedLib.Versions.l1)
          v1, 
          @useDependency(VersionedLib.Versions.l2)
          v2
        }
        @test model Test extends VersionedLib.VersionedProp<Versions.v2> {}
      }
      `)) as { MyService: Namespace; Test: Model };

    const [v1, v2] = runProjections(runner.program, MyService);

    const SpreadInstance1 = (v1.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance1, ["a"]);
    const SpreadInstance2 = (v2.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance2, ["a", "b"]);
  });

  it("use template from another library with versioned model", async () => {
    await runner.compile(`
      @versioned(Versions)
      namespace VersionedLib {
        enum Versions {v1, v2}
        model Template<T> {
          t: T;
        }
      }
      @versioned(Versions)
      namespace MyService {
        enum Versions {
          @useDependency(VersionedLib.Versions.v1)
          v1,
          @useDependency(VersionedLib.Versions.v2)
          v2
        }

        @added(Versions.v2)
        model Test is VersionedLib.Template<Bar>;

        @added(Versions.v2)
        model Bar {}
      }
      `);
  });

  it("respect changes in library between linked versions", async () => {
    const { MyService, Test } = (await runner.compile(`
      @versioned(Versions)
      namespace VersionedLib {
        enum Versions {l1, l2, l3, l4}
        model VersionedLibModel {
          a: string;

          @added(Versions.l2)
          b: string;

          @added(Versions.l3)
          c: string;

          @added(Versions.l4)
          d: string;
        }
      }
      @versioned(Versions)
      @test namespace MyService {
        enum Versions {
          @useDependency(VersionedLib.Versions.l1)
          v1, 
          @useDependency(VersionedLib.Versions.l3)
          v2
        }
        @test model Test extends VersionedLib.VersionedLibModel {}
      }
      `)) as { MyService: Namespace; Test: Model };

    const [v1, v2] = runProjections(runner.program, MyService);

    const SpreadInstance1 = (v1.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance1, ["a"]);
    const SpreadInstance2 = (v2.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance2, ["a", "b", "c"]);
  });

  it("respect changes in library between linked versions with multiple added and removed", async () => {
    const { MyService, Test } = (await runner.compile(`
      @versioned(Versions)
      namespace VersionedLib {
        enum Versions {l1, l2, l3, l4, l5, l6, l7, l8}
        model VersionedLibModel {
          a: string;

          @added(Versions.l2)
          @removed(Versions.l3)
          @added(Versions.l4)
          @removed(Versions.l5)
          @added(Versions.l6)
          @removed(Versions.l7)
          @added(Versions.l8)
          b: string;
        }
      }
      @versioned(Versions)
      @test namespace MyService {
        enum Versions {
          @useDependency(VersionedLib.Versions.l1)
          v1, 
          @useDependency(VersionedLib.Versions.l4)
          v2,
          @useDependency(VersionedLib.Versions.l7)
          v3
        }
        @test model Test extends VersionedLib.VersionedLibModel {}
      }
      `)) as { MyService: Namespace; Test: Model };

    const [v1, v2, v3] = runProjections(runner.program, MyService);

    const SpreadInstance1 = (v1.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance1, ["a"]);
    const SpreadInstance2 = (v2.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance2, ["a", "b"]);
    const SpreadInstance3 = (v3.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance3, ["a"]);
  });

  it("multiple version pin same dependency version", async () => {
    const { MyService, Test } = (await runner.compile(`
      @versioned(Versions)
      namespace VersionedLib {
        enum Versions {l1, l2}
        model VersionedLibModel {
          a: string;

          @added(Versions.l2)
          b: string;
        }
      }
      @versioned(Versions)
      @test namespace MyService {
        enum Versions {
          @useDependency(VersionedLib.Versions.l1)
          v1, 
          @useDependency(VersionedLib.Versions.l2)
          v2,
          @useDependency(VersionedLib.Versions.l2)
          v3
        }
        @test model Test extends VersionedLib.VersionedLibModel {}
      }
      `)) as { MyService: Namespace; Test: Model };

    const [v1, v2, v3] = runProjections(runner.program, MyService);

    const SpreadInstance1 = (v1.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance1, ["a"]);
    const SpreadInstance2 = (v2.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance2, ["a", "b"]);
    const SpreadInstance3 = (v3.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance3, ["a", "b"]);
  });

  it("can handle when the versions name are the same across different libraries", async () => {
    const { MyService, Test } = (await runner.compile(`
      @versioned(Versions)
      namespace VersionedLib {
        enum Versions {v1, v2}
        model Spread<T> {
          t: string;
          ...T;
        }
      }
      @versioned(Versions)
      @test namespace MyService {
        enum Versions {
          @useDependency(VersionedLib.Versions.v1)
          v1,
          @useDependency(VersionedLib.Versions.v2)
          v2
        }
        model Spreadable {
          a: int32;
          @added(Versions.v2) b: int32;
        }
        @test model Test extends VersionedLib.Spread<Spreadable> {}
      }
      `)) as { MyService: Namespace; Test: Model };

    const [v1, v2] = runProjections(runner.program, MyService);

    const SpreadInstance1 = (v1.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance1, ["t", "a"]);
    const SpreadInstance2 = (v2.projectedTypes.get(Test) as any).baseModel;
    assertHasProperties(SpreadInstance2, ["t", "a", "b"]);
  });

  // Test for https://github.com/microsoft/typespec/issues/760
  it("have a nested service namespace", async () => {
    const { MyService } = (await runner.compile(`
        @service({title: "Test"})
        @useDependency(Lib.Versions.v1)
        @test("MyService")
        namespace MyOrg.MyService {
        }
        @versioned(Versions)
        namespace Lib {
          enum Versions {
            v1: "v1",
          }
        }
      `)) as { MyService: Namespace };

    const [v1] = runProjections(runner.program, MyService);
    ok(v1.projectedTypes.get(MyService));
  });

  // Regression test for https://github.com/microsoft/typespec/issues/3263
  it("service is a nested namespace inside a versioned namespace", async () => {
    const { MyService } = (await runner.compile(`
      @versioned(Versions)
      namespace My.Service {
        enum Versions {
          @useDependency(Lib.Versions.v1) v1
        }
      
        @service
        @test("MyService")
        namespace Sub {
          model Foo is Lib.Bar;
        }
      }
      @versioned(Versions)
      namespace Lib {
        enum Versions { v1 }
        model Bar {}
      }
    `)) as { MyService: Namespace };

    const [v1] = runProjections(runner.program, MyService);
    ok(v1.projectedTypes.get(MyService));
  });

  // Test for https://github.com/microsoft/typespec/issues/786
  it("have a nested service namespace and libraries sharing common parent namespace", async () => {
    const { MyService } = (await runner.compile(`
        @service({title: "Test"})
        @useDependency(Lib.One.Versions.v1)
        @test("MyService")
        namespace MyOrg.MyService {
        }
        @versioned(Versions)
        namespace Lib.One {
          enum Versions { v1: "v1" }
        }
        
        @useDependency(Lib.One.Versions.v1)
        namespace Lib.Two { }
      `)) as { MyService: Namespace };

    const [v1] = runProjections(runner.program, MyService);
    ok(v1.projectedTypes.get(MyService));
  });
});

function runProjections(program: Program, rootNs: Namespace) {
  const versions = buildVersionProjections(program, rootNs);
  const projectedPrograms = versions.map((x) => projectProgram(program, x.projections));
  projectedPrograms.forEach((p) => expectDiagnosticEmpty(p.diagnostics));
  return projectedPrograms.map((p) => p.projector);
}
