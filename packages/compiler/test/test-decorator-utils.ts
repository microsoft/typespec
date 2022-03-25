import { deepStrictEqual, strictEqual } from "assert";
import { cadlTypeToJson, CadlValue, DecoratorContext } from "../core/index.js";
import { Type } from "../core/types.js";
import { createTestHost, expectDiagnostics } from "../testing/index.js";

describe("compiler: decorator utils", () => {
  describe("cadlTypeToJson", () => {
    async function convertDecoratorDataToJson(code: string) {
      const host = await createTestHost();
      let result: any;

      // add test decorators
      host.addJsFile("mapToJson.js", {
        $jsonData({ program }: DecoratorContext, target: Type, value: CadlValue) {
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
});
