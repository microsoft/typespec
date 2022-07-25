import { deepStrictEqual } from "assert";
import { InterfaceType, NamespaceType, OperationType } from "../../core/types.js";
import { getAllTags } from "../../lib/decorators.js";
import { createTestHost, TestHost } from "../../testing/index.js";

describe("compiler: tag decorator", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("applies @tag decorator to namespaces, interfaces, and operations", async (): Promise<void> => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test
      @tag("namespace")
      namespace OpNamespace {
        @test
        @tag("namespaceOp")
        op NamespaceOperation(): string;
      }

      @test
      @tag("interface")
      interface OpInterface {
        @test
        @tag("interfaceOp")
        InterfaceOperation(): string;
      }

      @test
      interface UntaggedInterface {
        @test
        @tag("taggedOp")
        TaggedOperation(): string;
      }

      @test
      @tag("recursiveNamespace")
      namespace RecursiveNamespace {
        @test
        @tag("recursiveInterface")
        interface RecursiveInterface {
          @test
          @tag("recursiveOperation")
          RecursiveOperation(): string;
        }
      }
      `
    );

    const {
      OpNamespace,
      OpInterface,
      NamespaceOperation,
      UntaggedInterface,
      InterfaceOperation,
      TaggedOperation,
      RecursiveNamespace,
      RecursiveInterface,
      RecursiveOperation,
    } = (await testHost.compile("./")) as {
      OpNamespace: NamespaceType;
      OpInterface: InterfaceType;
      UntaggedInterface: InterfaceType;
      NamespaceOperation: OperationType;
      InterfaceOperation: OperationType;
      TaggedOperation: OperationType;
      RecursiveNamespace: NamespaceType;
      RecursiveInterface: InterfaceType;
      RecursiveOperation: OperationType;
    };

    deepStrictEqual(getAllTags(testHost.program, OpNamespace), ["namespace"]);
    deepStrictEqual(getAllTags(testHost.program, OpInterface), ["interface"]);
    deepStrictEqual(getAllTags(testHost.program, UntaggedInterface), undefined);
    deepStrictEqual(getAllTags(testHost.program, NamespaceOperation), ["namespace", "namespaceOp"]);
    deepStrictEqual(getAllTags(testHost.program, InterfaceOperation), ["interface", "interfaceOp"]);
    deepStrictEqual(getAllTags(testHost.program, TaggedOperation), ["taggedOp"]);

    // Check recursive tag walking
    deepStrictEqual(getAllTags(testHost.program, RecursiveNamespace), ["recursiveNamespace"]);
    deepStrictEqual(getAllTags(testHost.program, RecursiveInterface), [
      "recursiveNamespace",
      "recursiveInterface",
    ]);
    deepStrictEqual(getAllTags(testHost.program, RecursiveOperation), [
      "recursiveNamespace",
      "recursiveInterface",
      "recursiveOperation",
    ]);
  });
});
