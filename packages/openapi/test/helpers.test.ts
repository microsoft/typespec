import { Operation } from "@cadl-lang/compiler";
import { BasicTestRunner, createTestRunner } from "@cadl-lang/compiler/testing";
import { strictEqual } from "assert";
import { resolveOperationId } from "../src/helpers.js";

describe("OpenAPI3 Helpers", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });
  describe("resolveOperationId", () => {
    async function testResolveOperationId(code: string) {
      const { foo } = (await runner.compile(code)) as { foo: Operation };
      return resolveOperationId(runner.program, foo);
    }

    it("return operation name if operation is defined at the root", async () => {
      const id = await testResolveOperationId(`@test op foo(): string;`);
      strictEqual(id, "foo");
    });

    it("return operation name if operation is defined under service namespace", async () => {
      const id = await testResolveOperationId(`
        @serviceTitle("Abc")
        namespace MyService;

        @test op foo(): string;
      `);
      strictEqual(id, "foo");
    });

    it("return group name and operaiton name if operation is defined under interface", async () => {
      const id = await testResolveOperationId(`
        interface Bar {
          @test op foo(): string;
        }
      `);
      strictEqual(id, "Bar_foo");
    });

    it("return group name and operation name if operation is defined under namespace that is not the service namespace", async () => {
      const id = await testResolveOperationId(`
        @serviceTitle("Abc")
        namespace MyService;

        namespace Bar {
          @test op foo(): string;
        }
      `);
      strictEqual(id, "Bar_foo");
    });
  });
});
