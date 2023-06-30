import { strictEqual } from "assert";
import { Model, Scalar } from "../../src/core/types.js";
import { TestHost, createTestHost } from "../../src/testing/index.js";

describe("compiler: validate", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("basic validate", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `  
      @test model M {
        ii: int64;

        validate ii >= 0 as chkii;
      }
      `
    );

    const { M } = (await testHost.compile("main.tsp")) as {
      M: Model;
    };

    strictEqual(M.validates.size, 1);
  });

  it("validate x2", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `  
      @test model M {
        ii: int64;

        validate ii >= 0 as chkiil;
        validate ii < 100 as chkiih;
      }
      `
    );

    const { M } = (await testHost.compile("main.tsp")) as {
      M: Model;
    };

    strictEqual(M.validates.size, 2);
  });

  it("basic validate without id", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `  
      @test model M {
        ii: int64;

        validate ii >= 0;
      }
      `
    );

    const { M } = (await testHost.compile("main.tsp")) as {
      M: Model;
    };

    strictEqual(M.validates.size, 1);
  });

  it("basic validate with doc", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `  
      @test model M {
        ii: int64;

        @doc("Check that ii is greater than or equal to 0")
        validate ii >= 0 as chkii;
      }
      `
    );

    const { M } = (await testHost.compile("main.tsp")) as {
      M: Model;
    };

    strictEqual(M.validates.size, 1);
    strictEqual(M.validates.get("chkii")?.decorators.length, 1);
    strictEqual(M.validates.get("chkii")?.decorators[0].decorator.name, "$doc");
    strictEqual(M.validates.get("chkii")?.decorators[0].args.length, 1);
    strictEqual(
      M.validates.get("chkii")?.decorators[0].args[0].jsValue,
      "Check that ii is greater than or equal to 0"
    );
  });

  it("basic scalar validate", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `  
      @test scalar S extends int64 {
        validate value >= 0 as chkv;
      }
      `
    );

    const { S } = (await testHost.compile("main.tsp")) as {
      S: Scalar;
    };

    strictEqual(S.validates.size, 1);
  });
});
