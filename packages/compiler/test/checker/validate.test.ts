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

        validate chkii: ii >= 0;
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

        validate chkiil: ii >= 0;
        validate chkiih: ii < 100;
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

  it("basic validate without id x2", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `  
      @test model M {
        ii: int64;

        validate ii >= 0;
        validate ii < 1000;
      }
      `
    );

    const { M } = (await testHost.compile("main.tsp")) as {
      M: Model;
    };

    strictEqual(M.validates.size, 2);
  });

  it("basic validate with doc", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `  
      @test model M {
        ii: int64;

        @doc("Check that ii is greater than or equal to 0")
        validate chkii: ii >= 0;
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
        validate chkv: value >= 0;
      }
      `
    );

    const { S } = (await testHost.compile("main.tsp")) as {
      S: Scalar;
    };

    strictEqual(S.validates.size, 1);
  });

  it.skip("resolves identifiers");
  it.skip("resolves member expressions");
  it.skip("converts logic expressions to a useful AST", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `  
      @test model M {
        ii: int64;

        validate chkii: ii >= if true { true; } else { false; };
      }
      `
    );

    const { M } = (await testHost.compile("main.tsp")) as {
      M: Model;
    };

    console.log(M.validates.get("chkii2")?.logic);
  });

  it.skip("checks that operands of logical expressions are booleans", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `  
      @test model M {
        ii: boolean;
        prop: string;
        validate chkii: 12 == true;
      }
      `
    );

    const { M } = (await testHost.compile("main.tsp")) as {
      M: Model;
    };
  });

  it("handles member expressions", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `  
      @test model M {
        n: N;
        validate chkn: n.value == 0;
      }

      @test model N {
        value: int64;
      }
      `
    );

    const { M, N } = (await testHost.compile("main.tsp")) as {
      M: Model;
      N: Model;
    };

    const logic = M.validates.get("chkn")!.logic;
    strictEqual(logic.kind, "EqualityExpression");
    strictEqual(logic.left.kind, "ReferenceExpression");
    strictEqual(logic.left.type, N.properties.get("value"));
    strictEqual(logic.right.kind, "NumericLiteral");

    const memberExpr = logic.left.target;
    strictEqual(memberExpr.kind, "MemberExpression");
    strictEqual(memberExpr.type, N.properties.get("value"));
    strictEqual(memberExpr.id, "value");
    strictEqual(memberExpr.base.kind, "Identifier");
    strictEqual(memberExpr.base.type, M.properties.get("n"));
  });

  it.skip("doesn't allow references decorators", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      model Foo { }
      @test scalar S extends int64 {
        validate chkv: @doc(1);
      }
      `
    );

    const { S } = (await testHost.compile("main.tsp")) as {
      S: Scalar;
    };

    strictEqual(S.validates.size, 1);
  });

  it.skip("doesn't allow model literal and tuple literal references", async () => {});
});
