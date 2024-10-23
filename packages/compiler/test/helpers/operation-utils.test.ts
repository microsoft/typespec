import { deepStrictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import {
  Interface,
  ListOperationOptions,
  Namespace,
  listOperationsIn,
} from "../../src/core/index.js";
import { BasicTestRunner, createTestRunner } from "../../src/testing/index.js";

describe("compiler: operation-utils", () => {
  let runner: BasicTestRunner;
  beforeEach(async () => {
    runner = await createTestRunner();
  });

  async function listOperationNames(
    container: Namespace | Interface,
    options?: ListOperationOptions,
  ): Promise<string[]> {
    return listOperationsIn(container, options).map((x) => x.name);
  }

  it("list all operations when using global namespace", async () => {
    await runner.compile(`
      op one(): void;
      
      namespace Bar {
        op two(): void;
      }

      interface Foo {
        three(): void;
      }
    `);

    deepStrictEqual(await listOperationNames(runner.program.getGlobalNamespaceType()), [
      "one",
      "two",
      "three",
    ]);
  });

  it("list all operations under interface", async () => {
    const { Foo } = (await runner.compile(`
      op one(): void;
      
      @test interface Foo {
        two(): void;
        three(): void;
      }
    `)) as { Foo: Interface };

    deepStrictEqual(await listOperationNames(Foo), ["two", "three"]);
  });

  it("list all operation including interface ops under namespace", async () => {
    const { Foo } = (await runner.compile(`
      op one(): void;
      
      @test namespace Foo {
        op two(): void;
        interface Bar {
          three(): void;
        }
      }
    `)) as { Foo: Interface };

    deepStrictEqual(await listOperationNames(Foo), ["two", "three"]);
  });

  it("include operation in subnamespace by default", async () => {
    const { Foo } = (await runner.compile(`
      op one(): void;
      
      @test namespace Foo {
        op two(): void;
        namespace Bar {
          op three(): void;
        }
      }
    `)) as { Foo: Interface };

    deepStrictEqual(await listOperationNames(Foo), ["two", "three"]);
  });

  it("can exclude sub namespaces", async () => {
    const { Foo } = (await runner.compile(`
      op one(): void;
      
      @test namespace Foo {
        op two(): void;
        namespace Bar {
          op three(): void;
        }
      }
    `)) as { Foo: Interface };

    deepStrictEqual(await listOperationNames(Foo, { recursive: false }), ["two"]);
  });
});
