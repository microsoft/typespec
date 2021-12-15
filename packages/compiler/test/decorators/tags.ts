import { deepStrictEqual } from "assert";
import { InterfaceType, NamespaceType, OperationType } from "../../core/types.js";
import { getAllTags, getTags } from "../../lib/decorators.js";
import { createTestHost, TestHost } from "../test-host.js";

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
      `
    );

    const {
      OpNamespace,
      OpInterface,
      NamespaceOperation,
      UntaggedInterface,
      InterfaceOperation,
      TaggedOperation,
    } = (await testHost.compile("./")) as {
      OpNamespace: NamespaceType;
      OpInterface: InterfaceType;
      UntaggedInterface: InterfaceType;
      NamespaceOperation: OperationType;
      InterfaceOperation: OperationType;
      TaggedOperation: OperationType;
    };

    deepStrictEqual(getTags(testHost.program, OpNamespace), ["namespace"]);
    deepStrictEqual(getTags(testHost.program, OpInterface), ["interface"]);
    deepStrictEqual(getTags(testHost.program, UntaggedInterface), []);
    deepStrictEqual(getAllTags(testHost.program, NamespaceOperation), ["namespace", "namespaceOp"]);
    deepStrictEqual(getAllTags(testHost.program, InterfaceOperation), ["interface", "interfaceOp"]);
    deepStrictEqual(getAllTags(testHost.program, TaggedOperation), ["taggedOp"]);
  });
});
