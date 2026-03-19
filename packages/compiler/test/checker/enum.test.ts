import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { DecoratorContext, Enum, Type } from "../../src/core/types.js";
import { getDoc } from "../../src/index.js";
import { expectDiagnostics, mockFile, t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: enums", () => {
  it("can be valueless", async () => {
    const { E } = await Tester.compile(t.code`
      enum ${t.enum("E")} {
        A, B, C
      }
    `);

    ok(E);
    ok(!E.members.get("A")!.value);
    ok(!E.members.get("B")!.value);
    ok(!E.members.get("C")!.value);
  });

  it("can have values", async () => {
    const { E, A, B, C } = await Tester.compile(t.code`
      enum ${t.enum("E")} {
        ${t.enumMember("A")}: "a";
        ${t.enumMember("B")}: "b";
        ${t.enumMember("C")}: "c";
      }
    `);

    ok(E);
    strictEqual(A.value, "a");
    strictEqual(B.value, "b");
    strictEqual(C.value, "c");
  });

  it("can be a model property", async () => {
    const { Foo } = await Tester.compile(t.code`
      namespace Foo;
      enum E { A, B, C }
      model ${t.model("Foo")} {
        prop: E;
      }
    `);

    ok(Foo);
    strictEqual(Foo.properties.get("prop")!.type.kind, "Enum");
  });

  it("can't have duplicate variants", async () => {
    const diagnostics = await Tester.diagnose(`
      enum A { A, A }
    `);
    expectDiagnostics(diagnostics, {
      code: "enum-member-duplicate",
      message: "Enum already has a member named A",
    });
  });

  it("can have spread members", async () => {
    const { Foo, Bar } = await Tester.compile(t.code`
      enum ${t.enum("Bar")} {
        One: "1",
        Two: "2",
      }
      enum ${t.enum("Foo")}  {
        ...Bar,
        Three: "3"
      }
    `);

    ok(Foo);
    ok(Bar);

    strictEqual(Foo.members.size, 3);
    strictEqual(Foo.members.get("One")!.name, "One");
    strictEqual(Foo.members.get("One")!.enum, Foo);
    strictEqual(Foo.members.get("One")!.sourceMember, Bar.members.get("One"));

    strictEqual(Bar.members.size, 2);
    strictEqual(Bar.members.get("One")!.name, "One");
    strictEqual(Bar.members.get("One")!.enum, Bar);
  });

  // Issue here was the same EnumType was create twice for each decorator on different namespaces causing equality issues when comparing the enum or enum member
  it("enums can be referenced from decorator on namespace", async () => {
    let refViaMyService: Enum | undefined;
    let refViaMyLib: Enum | undefined;

    await Tester.files({
      "lib.js": mockFile.js({
        $saveMyService(context: DecoratorContext, target: Type, ref: Enum) {
          refViaMyService = ref;
        },
        $saveMyLib(context: DecoratorContext, target: Type, ref: Enum) {
          refViaMyLib = ref;
        },
      }),
    }).import("./lib.js").compile(`
        @saveMyService(MyLib.E)
        namespace MyService {}

        @saveMyLib(E)
        namespace MyLib{
          enum E {
            a, b
          }
        }
      `);

    ok(refViaMyService);
    ok(refViaMyLib);
    strictEqual(refViaMyService, refViaMyLib);
  });

  it("can decorate spread member independently", async () => {
    const { Base, Spread, program } = await Tester.compile(t.code`
      enum ${t.enum("Base")} {@doc("base doc") one}
      enum ${t.enum("Spread")} {...Base}

      @@doc(Spread.one, "override for spread");
    `);

    strictEqual(getDoc(program, Spread.members.get("one")!), "override for spread");
    strictEqual(getDoc(program, Base.members.get("one")!), "base doc");
  });
});
