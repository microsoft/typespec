import { strictEqual, ok } from "assert";
import { ModelType, NamespaceType, Type } from "../../compiler/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("namespaces with blocks", () => {
  const blues = new WeakSet();
  function blue(_: any, target: Type) {
    blues.add(target);
  }

  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
    testHost.addJsFile("blue.js", { blue });
  });

  it("can be decorated", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      @blue @test namespace Z.Q;
      @blue @test namespace N { }
      @blue @test namespace X.Y { }
      `
    );
    const { N, Y, Q } = (await testHost.compile("./")) as {
      N: NamespaceType;
      Y: NamespaceType;
      Q: NamespaceType;
    };

    ok(blues.has(N), "N is blue");
    ok(blues.has(Y), "Y is blue");
    ok(blues.has(Q), "Q is blue");
  });

  it("merges like namespaces", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      namespace N { model X { x: string } }
      namespace N { model Y { y: string } }
      namespace N { @test model Z { ... X, ... Y } }
      `
    );
    const { Z } = (await testHost.compile("./")) as {
      Z: ModelType;
    };

    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("merges like namespaces across files", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      namespace N { model X { x: string } }
      `
    );
    testHost.addAdlFile(
      "b.adl",
      `
      namespace N { model Y { y: int32 } }
      `
    );
    testHost.addAdlFile(
      "c.adl",
      `
      namespace N { @test model Z { ... X, ... Y } }
      `
    );
    const { Z } = (await testHost.compile("./")) as {
      Z: ModelType;
    };
    strictEqual(Z.properties.size, 2, "has two properties");
  });

  it("merges sub-namespaces across files", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      namespace N { namespace M { model X { x: string } } }
      `
    );
    testHost.addAdlFile(
      "b.adl",
      `
      namespace N { namespace M { model Y { y: int32 } } }
      `
    );
    testHost.addAdlFile(
      "c.adl",
      `
      namespace N { @test model Z { ... M.X, ... M.Y } }
      `
    );

    const { Z } = (await testHost.compile("./")) as {
      Z: ModelType;
    };
    strictEqual(Z.properties.size, 2, "has two properties");
  });
});

describe("blockless namespaces", () => {
  const blues = new WeakSet();
  function blue(_: any, target: Type) {
    blues.add(target);
  }

  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
    testHost.addJsFile("blue.js", { blue });
  });

  it("merges properly with other namespaces", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      namespace N;
      model X { x: int32 }
      `
    );
    testHost.addAdlFile(
      "b.adl",
      `
      namespace N;
      model Y { y: int32 }
      `
    );
    testHost.addAdlFile(
      "c.adl",
      `
      @test model Z { ... N.X, ... N.Y }
      `
    );
    const { Z } = (await testHost.compile("./")) as {
      Z: ModelType;
    };
    strictEqual(Z.properties.size, 2, "has two properties");
  });
});
