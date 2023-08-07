import { strictEqual } from "assert";
import { IntrinsicType, LogicCallExpression, Model, Scalar } from "../../src/core/types.js";
import { TestHost, createTestHost } from "../../src/testing/index.js";

describe.only("compiler: validate", () => {
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

        validate foo: ii >= 0;
        validate foo2: ii < 1000;
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
    const validate = S.validates.get("chkv")!;
    strictEqual(validate.logic.kind, "RelationalExpression");
    strictEqual(validate.logic.left.kind, "ReferenceExpression");
    strictEqual(validate.logic.left.type, S);
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

  it("can resolve built-in functions", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test model M {
        items: string[];
        str: string;
        validate checkItems: items::someOf((x) => { x == "foo";});
        validate checkStr: str::startsWith("foo");
      }
      `
    );

    const { M } = (await testHost.compile("main.tsp")) as {
      M: Model;
    };

    const checkItems = M.validates.get("checkItems")!.logic as LogicCallExpression;
    strictEqual((checkItems.target.type as IntrinsicType).name, "Array::someOf");
    strictEqual(checkItems.arguments[0].kind, "LambdaExpression");

    const validateStr = M.validates.get("checkStr")!.logic as LogicCallExpression;
    strictEqual((validateStr.target.type as IntrinsicType).name, "String::startsWith");
    strictEqual(validateStr.arguments[0].kind, "StringLiteral");
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

    // todo: test type

    const logic = M.validates.get("chkn")!.logic;
    strictEqual(logic.kind, "EqualityExpression");
    strictEqual(logic.left.kind, "ReferenceExpression");
    strictEqual(logic.left.referencedType, N.properties.get("value"));
    strictEqual(logic.right.kind, "NumericLiteral");

    const memberExpr = logic.left.target;
    strictEqual(memberExpr.kind, "MemberExpression");
    strictEqual(memberExpr.referencedType, N.properties.get("value"));
    strictEqual(memberExpr.id, "value");
    strictEqual(memberExpr.base.kind, "Identifier");
    strictEqual(memberExpr.base.referencedType, M.properties.get("n"));
  });

  it.skip("allows multiple fn calls", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test model M {
        str1: string;
        str2: string;
        
        validate checkStr: str1::concat(str2)::concat(str1);
      }
      `
    );

    const { M } = (await testHost.compile("main.tsp")) as {
      M: Model;
    };

    console.log(M.validates.get("checkStr")?.logic);
  });

  it("allows for arithmetic on scalar subtypes", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test scalar S extends int64 {
        validate chkv: value + 1 == 2;
      }
      `
    );

    const { S } = (await testHost.compile("main.tsp")) as {
      S: Scalar;
    };

    // TODO: Validate
  });

  it("produces union types for if statements", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test model M {
        string: string;
        int32: int32;
        numeric: numeric;
        
        // this check will only succeed if we properly produce a union type
        validate c1: if (true) { string; } else { int32; } == int32;
      }
      `
    );

    await testHost.compile("main.tsp");
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
