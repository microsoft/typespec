import { strictEqual } from "assert";
import {
  addModelProperty,
  addOperationParameter,
  addOperationResponseType,
} from "../core/mutators.js";
import { Program } from "../core/program.js";
import { ModelType, OperationType, UnionType } from "../core/types.js";
import { createTestHost, TestHost } from "./test-host.js";

describe("cadl: mutators", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  function $addBarProperty(program: Program, model: ModelType) {
    addModelProperty(program, model, "bar", "string");
  }

  it("addModelProperty adds a property to a model type", async () => {
    testHost.addJsFile("a.js", { $addBarProperty });
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./a.js";

      @test
      @addBarProperty
      model A { foo: int32; }
      `
    );

    const { A } = (await testHost.compile("./")) as { A: ModelType };

    strictEqual(A.properties.size, 2);
    strictEqual(A.properties.get("bar")!.name, "bar");
    strictEqual((A.properties.get("bar")!.type as ModelType).name, "string");
  });

  function $addParameters(program: Program, operation: OperationType) {
    addOperationParameter(program, operation, "omega", "string");
    addOperationParameter(program, operation, "alpha", "int64", { insertIndex: 0 });
    addOperationParameter(program, operation, "beta", "B.Excellent", { insertIndex: 1 });
  }

  it("addOperationParameter inserts operation parameters", async () => {
    testHost.addJsFile("a.js", { $addParameters });
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./a.cadl";
      import "./b.cadl";
      `
    );
    testHost.addCadlFile(
      "a.cadl",
      `
      import "./a.js";
      import "./b.cadl";

      @test
      @addParameters
      op TestOp(foo: int32): string;
      `
    );
    testHost.addCadlFile(
      "b.cadl",
      `
      namespace B;
      model Excellent {}
      `
    );

    const { TestOp } = (await testHost.compile("./")) as { TestOp: OperationType };

    const params = Array.from(TestOp.parameters.properties.entries());
    strictEqual(TestOp.parameters.properties.size, 4);
    strictEqual(params[0][0], "alpha");
    strictEqual((params[0][1].type as ModelType).name, "int64");
    strictEqual(params[1][0], "beta");
    strictEqual((params[1][1].type as ModelType).name, "Excellent");
    strictEqual(params[2][0], "foo");
    strictEqual((params[2][1].type as ModelType).name, "int32");
    strictEqual(params[3][0], "omega");
    strictEqual((params[3][1].type as ModelType).name, "string");
  });

  function $addResponseTypes(program: Program, operation: OperationType) {
    addOperationResponseType(program, operation, "int64");
    addOperationResponseType(program, operation, "A.Response");
  }

  it("addModelProperty adds a property to a model type", async () => {
    testHost.addJsFile("a.js", { $addResponseTypes });
    testHost.addCadlFile(
      "main.cadl",
      `
      import "./a.js";

      @test
      @addResponseTypes
      op TestOp(foo: int32): string;

      namespace A {
        model Response {}
      }
      `
    );

    const { TestOp } = (await testHost.compile("./")) as { TestOp: OperationType };

    const unionType = TestOp.returnType as UnionType;
    strictEqual(unionType.options.length, 3);
    strictEqual((unionType.options[0] as ModelType).name, "string");
    strictEqual((unionType.options[1] as ModelType).name, "int64");
    strictEqual((unionType.options[2] as ModelType).name, "Response");
  });
});
