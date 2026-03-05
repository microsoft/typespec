import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { getAllTags } from "../../src/lib/decorators.js";
import { t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: tag decorator", () => {
  it("applies @tag decorator to namespaces, interfaces, and operations", async (): Promise<void> => {
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
      program,
    } = await Tester.compile(t.code`
      @tag("namespace")
      namespace ${t.namespace("OpNamespace")} {
        @tag("namespaceOp")
        op ${t.op("NamespaceOperation")}(): string;
      }

      @tag("interface")
      interface ${t.interface("OpInterface")} {
        @tag("interfaceOp")
        ${t.op("InterfaceOperation")}(): string;
      }

      interface ${t.interface("UntaggedInterface")} {
        @tag("taggedOp")
        ${t.op("TaggedOperation")}(): string;
      }

      @tag("recursiveNamespace")
      namespace ${t.namespace("RecursiveNamespace")} {
        @tag("recursiveInterface")
        interface ${t.interface("RecursiveInterface")} {
          @tag("recursiveOperation")
          ${t.op("RecursiveOperation")}(): string;
        }
      }
    `);

    deepStrictEqual(getAllTags(program, OpNamespace), ["namespace"]);
    deepStrictEqual(getAllTags(program, OpInterface), ["interface"]);
    deepStrictEqual(getAllTags(program, UntaggedInterface), undefined);
    deepStrictEqual(getAllTags(program, NamespaceOperation), ["namespace", "namespaceOp"]);
    deepStrictEqual(getAllTags(program, InterfaceOperation), ["interface", "interfaceOp"]);
    deepStrictEqual(getAllTags(program, TaggedOperation), ["taggedOp"]);

    // Check recursive tag walking
    deepStrictEqual(getAllTags(program, RecursiveNamespace), ["recursiveNamespace"]);
    deepStrictEqual(getAllTags(program, RecursiveInterface), [
      "recursiveNamespace",
      "recursiveInterface",
    ]);
    deepStrictEqual(getAllTags(program, RecursiveOperation), [
      "recursiveNamespace",
      "recursiveInterface",
      "recursiveOperation",
    ]);
  });
});
