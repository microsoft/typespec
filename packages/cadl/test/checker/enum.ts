import { match, ok, strictEqual } from "assert";
import { EnumMemberType, EnumType, ModelType } from "../../compiler/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("cadl: enums", () => {
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
    strictEqual(diagnostics.length, 1);
    match(diagnostics[0].message, /Enum already has a member/);
  });
});
