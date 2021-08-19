import { match, ok, strictEqual } from "assert";
import { ModelType, Type } from "../../core/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("cadl: models", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("allow template parameters passed into decorators", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      model B { }
      model C { }
      model A extends B, C {

      }
      `
    );

    const { B, C } = (await testHost.compile("./")) as {
      B: ModelType;
      C: ModelType;
    };
  });

  it("doesn't allow duplicate properties", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      model A { x: int32; x: int32; }
      `
    );
    const diagnostics = await testHost.diagnose("main.cadl");
    strictEqual(diagnostics.length, 1);
    match(diagnostics[0].message, /Model already has a property/);
  });

  describe("with extends", () => {
    it("doesn't allow duplicate properties", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A { x: int32 }
        model B extends A { x: int32 };
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      strictEqual(diagnostics.length, 1);
      match(diagnostics[0].message, /Model has an inherited property/);
    });
  });

  describe("with is", () => {
    let testHost: TestHost;
    let blues = new WeakSet();
    let reds = new WeakSet();
    beforeEach(async () => {
      testHost = await createTestHost();
      testHost.addJsFile("dec.js", {
        $blue(p: any, t: Type) {
          blues.add(t);
        },
        $red(p: any, t: Type) {
          reds.add(t);
        },
      });
    });

    it("copies decorators", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        import "./dec.js";
        @blue model A { }
        @test @red model B is A { };
        `
      );
      const { B } = (await testHost.compile("main.cadl")) as { B: ModelType };
      ok(blues.has(B));
      ok(reds.has(B));
    });

    it("copies properties", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        model A { x: int32 }
        @test model B is A { y: string };
        `
      );
      const { B } = (await testHost.compile("main.cadl")) as { B: ModelType };
      ok(B.properties.has("x"));
      ok(B.properties.has("y"));
    });

    it("copies heritage", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        import "./dec.js";
        @test model A { x: int32 }
        model B extends A { y: string };
        @test model C is B { }
        `
      );
      const { A, C } = (await testHost.compile("main.cadl")) as { A: ModelType; C: ModelType };
      strictEqual(C.baseModels[0], A);
    });

    it("doesn't allow duplicate properties", async () => {
      testHost.addCadlFile(
        "main.cadl",
        `
        import "./dec.js";
        model A { x: int32 }
        model B is A { x: int32 };
        `
      );
      const diagnostics = await testHost.diagnose("main.cadl");
      strictEqual(diagnostics.length, 1);
      match(diagnostics[0].message, /Model already has a property/);
    });
  });
});
