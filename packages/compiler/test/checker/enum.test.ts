import { ok, strictEqual } from "assert";
import { DecoratorContext, EnumMemberType, EnumType, ModelType, Type } from "../../core/types.js";
import { createTestHost, expectDiagnostics, TestHost } from "../../testing/index.js";

describe("compiler: enums", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("can be valueless", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test enum E {
        A, B, C
      }
      `
    );

    const { E } = (await testHost.compile("./")) as {
      E: EnumType;
    };

    ok(E);
    ok(!E.members[0].value);
    ok(!E.members[1].value);
    ok(!E.members[2].value);
  });

  it("can have values", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test enum E {
        @test("A") A: "a";
        @test("B") B: "b";
        @test("C") C: "c";
      }
      `
    );

    const { E, A, B, C } = (await testHost.compile("./")) as {
      E: EnumType;
      A: EnumMemberType;
      B: EnumMemberType;
      C: EnumMemberType;
    };

    ok(E);
    strictEqual(A.value, "a");
    strictEqual(B.value, "b");
    strictEqual(C.value, "c");
  });

  it("can be a model property", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      namespace Foo;
      enum E { A, B, C }
      @test model Foo {
        prop: E;
      }
      `
    );

    const { Foo } = (await testHost.compile("./")) as {
      Foo: ModelType;
    };

    ok(Foo);
    strictEqual(Foo.properties.get("prop")!.type.kind, "Enum");
  });

  it("can't have duplicate variants", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      enum A { A, A }
      `
    );
    const diagnostics = await testHost.diagnose("main.cadl");
    expectDiagnostics(diagnostics, {
      code: "enum-member-duplicate",
      message: "Enum already has a member named A",
    });
  });

  it("can have spread members", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test enum Bar {
        One: "1",
        Two: "2",
      }
      @test enum Foo  {
        ...Bar,
        Three: "3"
      }
      `
    );

    const { Foo, Bar } = (await testHost.compile("main.cadl")) as {
      Foo: EnumType;
      Bar: EnumType;
    };
    ok(Foo);
    ok(Bar);

    strictEqual(Foo.members.length, 3);
    strictEqual(Foo.members[0].name, "One");
    strictEqual(Foo.members[0].enum, Foo);
    strictEqual(Foo.members[0].sourceMember, Bar.members[0]);

    strictEqual(Bar.members.length, 2);
    strictEqual(Bar.members[0].name, "One");
    strictEqual(Bar.members[0].enum, Bar);
  });

  // Issue here was the same EnumType was create twice for each decorator on different namespaces causing equality issues when comparing the enum or enum member
  it("enums can be refernced from decorator on namespace", async () => {
    let refViaMyService: EnumType | undefined;
    let refViaMyLib: EnumType | undefined;
    testHost.addJsFile("lib.js", {
      $saveMyService(context: DecoratorContext, target: Type, ref: EnumType) {
        refViaMyService = ref;
      },
      $saveMyLib(context: DecoratorContext, target: Type, ref: EnumType) {
        refViaMyLib = ref;
      },
    });
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./lib.js";

      @saveMyService(MyLib.E)
      namespace MyService {}

      @saveMyLib(E)
      namespace MyLib{
        @test enum E {
          a, b
        }
      }
      `
    );

    await testHost.compile("./");

    ok(refViaMyService);
    ok(refViaMyLib);
    strictEqual(refViaMyService, refViaMyLib);
  });
});
