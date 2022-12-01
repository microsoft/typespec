import { deepStrictEqual, strictEqual } from "assert";
import {
  cadlTypeToJson,
  CadlValue,
  DecoratorContext,
  validateDecoratorUniqueOnNode,
} from "../core/index.js";
import { Type } from "../core/types.js";
import {
  BasicTestRunner,
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../testing/index.js";

describe("compiler: decorator utils", () => {
  describe("cadlTypeToJson", () => {
    async function convertDecoratorDataToJson(code: string) {
      const host = await createTestHost();
      let result: any;

      // add test decorators
      host.addJsFile("mapToJson.js", {
        $jsonData(context: DecoratorContext, target: Type, value: CadlValue) {
          result = cadlTypeToJson(value, target);
        },
      });

      host.addCadlFile(
        "main.cadl",
        `
        import "./mapToJson.js";

        ${code};
      `
      );
      await host.compile("main.cadl");
      return result;
    }
    it("can convert a string", async () => {
      const [data, diagnostics] = await convertDecoratorDataToJson(`
        @jsonData("string")
        model Foo {}
      `);

      strictEqual(data, "string");
      strictEqual(diagnostics.length, 0);
    });

    it("can convert a number", async () => {
      const [data, diagnostics] = await convertDecoratorDataToJson(`
        @jsonData(123)
        model Foo {}
      `);

      strictEqual(data, 123);
      strictEqual(diagnostics.length, 0);
    });

    it("can convert a boolean", async () => {
      const [data, diagnostics] = await convertDecoratorDataToJson(`
        @jsonData(true)
        model Foo {}
      `);

      strictEqual(data, true);
      strictEqual(diagnostics.length, 0);
    });

    it("can convert a tuple", async () => {
      const [data, diagnostics] = await convertDecoratorDataToJson(`
        @jsonData(["string", 123, true])
        model Foo {}
      `);

      deepStrictEqual(data, ["string", 123, true]);
      strictEqual(diagnostics.length, 0);
    });

    it("can convert a model", async () => {
      const [data, diagnostics] = await convertDecoratorDataToJson(`
        @jsonData({string: "string", number: 123, bool: true})
        model Foo {}
      `);

      deepStrictEqual(data, { string: "string", number: 123, bool: true });
      strictEqual(diagnostics.length, 0);
    });

    it("can convert a named model", async () => {
      const [data, diagnostics] = await convertDecoratorDataToJson(`
        model MyModel {string: "string", number: 123, bool: true}
        @jsonData(MyModel)
        model Foo {}
      `);

      deepStrictEqual(data, { string: "string", number: 123, bool: true });
      strictEqual(diagnostics.length, 0);
    });

    it("can a nested model", async () => {
      const [data, diagnostics] = await convertDecoratorDataToJson(`
        @jsonData({string: "string", nested: {foo: "bar"}, bool: true})
        model Foo {}
      `);

      deepStrictEqual(data, { string: "string", nested: { foo: "bar" }, bool: true });
      strictEqual(diagnostics.length, 0);
    });

    it("emit diagnostic if value it not serializable", async () => {
      const [data, diagnostics] = await convertDecoratorDataToJson(`
        @jsonData("foo" | "bar")
        model Foo {}
      `);

      deepStrictEqual(data, undefined);
      expectDiagnostics(diagnostics, {
        code: "invalid-value",
        message: "Type 'Union' is not a value type.",
      });
    });

    it("emit diagnostic if value under model it not serializable", async () => {
      const [data, diagnostics] = await convertDecoratorDataToJson(`
        @jsonData({string: "string", some: "foo" | "bar", other: 123})
        model Foo {}
      `);

      deepStrictEqual(data, undefined);
      expectDiagnostics(diagnostics, {
        code: "invalid-value",
        message: "Type 'Union' of 'some' is not a value type.",
      });
    });
  });

  describe("validateDecoratorUniqueOnNode", () => {
    let runner: BasicTestRunner;
    beforeEach(async () => {
      const host = await createTestHost();
      runner = createTestWrapper(host, { wrapper: (x) => `import "./lib.js";\n${x}` });

      function $tag(context: DecoratorContext, target: Type) {
        validateDecoratorUniqueOnNode(context, target, $tag);
      }
      // add test decorators
      host.addJsFile("lib.js", {
        $tag,
      });
    });

    it("emit diagnostics if using the same decorator on the same node", async () => {
      const diagnostics = await runner.diagnose(`
        @tag
        @tag
        model Foo {}
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "duplicate-decorator",
          message: "Decorator @tag cannot be used twice on the same node.",
        },
        {
          code: "duplicate-decorator",
          message: "Decorator @tag cannot be used twice on the same node.",
        },
      ]);
    });

    it("shouldn't emit diagnostic if decorator is used once only", async () => {
      const diagnostics = await runner.diagnose(`
        @tag
        model Foo {}
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("shouldn't emit diagnostic if decorator is defined twice via `model is`", async () => {
      const diagnostics = await runner.diagnose(`
        @tag
        model Bar {}
        @tag
        model Foo is Bar;
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("shouldn't emit diagnostic if decorator is used again as augment decorator", async () => {
      const diagnostics = await runner.diagnose(`
        @tag
        model Foo {}

        @@tag(Foo)
      `);

      expectDiagnosticEmpty(diagnostics);
    });
  });
});
