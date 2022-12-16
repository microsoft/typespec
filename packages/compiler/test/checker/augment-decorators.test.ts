import { strictEqual } from "assert";
import { Type } from "../../core/types.js";
import { createTestHost, TestHost } from "../../testing/index.js";

describe("compiler: checker: augment decorators", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("run decorator without arguments", async () => {
    let blueThing: Type | undefined;

    testHost.addJsFile("test.js", {
      $blue(_: any, t: Type) {
        blueThing = t;
      },
    });

    testHost.addCadlFile(
      "test.cadl",
      `
      import "./test.js";

      @test model Foo { };

      @@blue(Foo);
      `
    );

    const { Foo } = await testHost.compile("test.cadl");
    strictEqual(Foo, blueThing);
  });

  it("run decorator with arguments", async () => {
    let customName: string | undefined;

    testHost.addJsFile("test.js", {
      $customName(_: any, t: Type, n: string) {
        customName = n;
      },
    });

    testHost.addCadlFile(
      "test.cadl",
      `
      import "./test.js";

      model Foo { };

      @@customName(Foo, "FooCustom");
      `
    );

    await testHost.compile("test.cadl");
    strictEqual(customName, "FooCustom");
  });

  describe("declaration scope", () => {
    let blueThing: Type | undefined;

    beforeEach(() => {
      blueThing = undefined;
      testHost.addJsFile("test.js", {
        $blue(_: any, t: Type) {
          blueThing = t;
        },
      });
    });
    it("can be defined at the root of document", async () => {
      testHost.addCadlFile(
        "test.cadl",
        `
        import "./test.js";
  
        @test model Foo { };
  
        @@blue(Foo);
        `
      );

      const { Foo } = await testHost.compile("test.cadl");
      strictEqual(Foo, blueThing);
    });

    it("can be defined in blockless namespace", async () => {
      testHost.addCadlFile(
        "test.cadl",
        `
        import "./test.js";
  
        namespace MyLibrary;

        @test model Foo { };
  
        @@blue(Foo);
        `
      );

      const { Foo } = await testHost.compile("test.cadl");
      strictEqual(Foo, blueThing);
    });

    it("can be defined in namespace", async () => {
      testHost.addCadlFile(
        "test.cadl",
        `
        import "./test.js";
  
        namespace MyLibrary {
          @test model Foo { };
          
          @@blue(Foo);
        }
        `
      );

      const { Foo } = await testHost.compile("test.cadl");
      strictEqual(Foo, blueThing);
    });
  });

  describe("augment types", () => {
    async function expectTarget(code: string, reference: string) {
      let customName: string | undefined;
      let runOnTarget: Type | undefined;

      testHost.addJsFile("test.js", {
        $customName(_: any, t: Type, n: string) {
          runOnTarget = t;
          customName = n;
        },
      });

      testHost.addCadlFile(
        "test.cadl",
        `
      import "./test.js";

      ${code}

      @@customName(${reference}, "FooCustom");
      `
      );

      const { target } = await testHost.compile("test.cadl");
      strictEqual(runOnTarget?.kind, target.kind);
      strictEqual(runOnTarget, target);
      strictEqual(customName, "FooCustom");
    }

    it("namespace", () => expectTarget(`@test("target") namespace Foo {}`, "Foo"));

    it("global namespace", () => expectTarget(`@@test(global, "target")`, "global"));

    it("model", () => expectTarget(`@test("target") model Foo {}`, "Foo"));
    it("model property", () =>
      expectTarget(
        `model Foo { 
          @test("target") name: string
        }`,
        "Foo.name"
      ));
    it("enum", () => expectTarget(`@test("target") enum Foo { a, b }`, "Foo"));
    it("enum member", () => expectTarget(`enum Foo { @test("target") a, b }`, "Foo.a"));
    it("union", () => expectTarget(`@test("target") union Foo { }`, "Foo"));
    it("union variant", () => expectTarget(`union Foo { @test("target") a: {}, b: {} }`, "Foo.a"));
    it("operation", () => expectTarget(`@test("target") op foo(): string;`, "foo"));
    it("interface", () => expectTarget(`@test("target") interface Foo { }`, "Foo"));
    it("operation in interface", () =>
      expectTarget(`interface Foo { @test("target") list(): void }`, "Foo.list"));
  });
});
