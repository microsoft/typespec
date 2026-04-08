import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { Interface, ListOperationOptions, Namespace, listOperationsIn } from "../../src/index.js";
import { t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: operation-utils", () => {
  async function listOperationNames(
    container: Namespace | Interface,
    options?: ListOperationOptions,
  ): Promise<string[]> {
    return listOperationsIn(container, options).map((x) => x.name);
  }

  it("list all operations when using global namespace", async () => {
    const { program } = await Tester.compile(`
      op one(): void;
      
      namespace Bar {
        op two(): void;
      }

      interface Foo {
        three(): void;
      }
    `);

    deepStrictEqual(await listOperationNames(program.getGlobalNamespaceType()), [
      "one",
      "two",
      "three",
    ]);
  });

  it("list all operations under interface", async () => {
    const { Foo } = await Tester.compile(t.code`
      op one(): void;
      
      interface ${t.interface("Foo")} {
        two(): void;
        three(): void;
      }
    `);

    deepStrictEqual(await listOperationNames(Foo), ["two", "three"]);
  });

  it("list all operation including interface ops under namespace", async () => {
    const { Foo } = await Tester.compile(t.code`
      op one(): void;
      
      namespace ${t.namespace("Foo")} {
        op two(): void;
        interface Bar {
          three(): void;
        }
      }
    `);

    deepStrictEqual(await listOperationNames(Foo), ["two", "three"]);
  });

  it("include operation in subnamespace by default", async () => {
    const { Foo } = await Tester.compile(t.code`
      op one(): void;
      
      namespace ${t.namespace("Foo")} {
        op two(): void;
        namespace Bar {
          op three(): void;
        }
      }
    `);

    deepStrictEqual(await listOperationNames(Foo), ["two", "three"]);
  });

  it("can exclude sub namespaces", async () => {
    const { Foo } = await Tester.compile(t.code`
      op one(): void;
      
      namespace ${t.namespace("Foo")} {
        op two(): void;
        namespace Bar {
          op three(): void;
        }
      }
    `);

    deepStrictEqual(await listOperationNames(Foo, { recursive: false }), ["two"]);
  });
});
