import { notStrictEqual, strictEqual } from "assert";
import { IntrinsicType, LogicCallExpression, Model, Scalar } from "../../src/core/types.js";
import { TestHost, createTestHost, expectDiagnostics } from "../../src/testing/index.js";

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

  it("resolves identifiers", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test model M {
        flag: boolean;

        validate chkf: flag;
      }
      `
    );

    const { M } = (await testHost.compile("main.tsp")) as {
      M: Model;
    };

    notStrictEqual(M.validates.get("chkf")?.logic, undefined);

    const n1 = M.validates.get("chkf")!.logic;
    strictEqual(n1.kind, "ReferenceExpression");
    strictEqual(n1.target.kind, "Identifier");
    strictEqual(n1.target.name, "flag");
    strictEqual(n1.type.kind, "Scalar");
    strictEqual(n1.type.name, "boolean");
  });

  it("resolves member expressions", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `
      @test model M {
        om: OModel;

        validate chks: om.s != "";
        validate chki: om.i != 0;
      }

      model OModel {
        s: string;
        i: IV;
      }

      scalar IV extends int64;
      `
    );

    const { M } = (await testHost.compile("main.tsp")) as {
      M: Model;
    };

    notStrictEqual(M.validates.get("chks")?.logic, undefined);
    const s1 = M.validates.get("chks")!.logic;
    strictEqual(s1.kind, "EqualityExpression");

    const s2 = s1.left;
    strictEqual(s2.kind, "ReferenceExpression");
    strictEqual(s2.target.kind, "MemberExpression");
    strictEqual(s2.target.base.kind, "Identifier");
    strictEqual(s2.target.base.name, "om");
    strictEqual(s2.target.id, "s");
    strictEqual(s2.type.kind, "Scalar");
    strictEqual(s2.type.name, "string");

    notStrictEqual(M.validates.get("chki")?.logic, undefined);
    const i1 = M.validates.get("chki")!.logic;
    strictEqual(i1.kind, "EqualityExpression");

    const i2 = i1.left;
    strictEqual(i2.kind, "ReferenceExpression");
    strictEqual(i2.target.kind, "MemberExpression");
    strictEqual(i2.target.base.kind, "Identifier");
    strictEqual(i2.target.base.name, "om");
    strictEqual(i2.target.id, "i");
    strictEqual(i2.type.kind, "Scalar");
    strictEqual(i2.type.name, "IV");
  });

  it("converts logic expressions to a useful AST", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `  
      @test model M {
        ii: int64;

        validate chkii: ii >= if true { 1; } else { 2; };
      }
      `
    );

    const { M } = (await testHost.compile("main.tsp")) as {
      M: Model;
    };

    notStrictEqual(M.validates.get("chkii")?.logic, undefined);

    const n1 = M.validates.get("chkii")!.logic;
    strictEqual(n1.kind, "RelationalExpression");

    const n2 = n1.left;
    strictEqual(n2.kind, "ReferenceExpression");
    strictEqual(n2.target.kind, "Identifier");
    strictEqual(n2.type.kind, "Scalar");
    strictEqual(n2.type.name, "int64");

    const n3 = n1.right;
    strictEqual(n3.kind, "IfExpression");
    strictEqual(n3.test.kind, "BooleanLiteral");

    const n4 = n3.consequent;
    strictEqual(n4.kind, "BlockExpression");
    strictEqual(n4.statements.length, 1);

    const n5 = n4.statements[0];
    strictEqual(n5.expr.kind, "NumericLiteral");
    strictEqual(n5.expr.value, 1);
  });

  it("checks that operands of logical expressions are booleans", async () => {
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

    const diagnostics = await testHost.diagnose("main.tsp");

    expectDiagnostics(diagnostics, [
      { code: "type-expected", message: /The types numeric and boolean are not comparable/ },
    ]);
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

    notStrictEqual(S.validates.get("chkv")?.logic, undefined);

    const n1 = S.validates.get("chkv")!.logic;
    strictEqual(n1.kind, "EqualityExpression");

    const n2 = n1.left;
    strictEqual(n2.kind, "ArithmeticExpression");
    strictEqual(n2.op, "+");

    const n3 = n2.left;
    strictEqual(n3.kind, "ReferenceExpression");
    strictEqual(n3.target.kind, "Identifier");
    strictEqual(n3.target.name, "value");
    strictEqual(n3.type.kind, "Scalar");
    strictEqual(n3.type.name, "S");
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
