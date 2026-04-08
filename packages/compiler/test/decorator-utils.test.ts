import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "vitest";
import { Type } from "../src/core/types.js";
import {
  DecoratorContext,
  TypeSpecValue,
  typespecTypeToJson,
  validateDecoratorNotOnType,
  validateDecoratorUniqueOnNode,
} from "../src/index.js";
import { expectDiagnosticEmpty, expectDiagnostics, mockFile } from "../src/testing/index.js";
import { Tester } from "./tester.js";

describe("compiler: decorator utils", () => {
  describe("typespecTypeToJson", () => {
    async function convertDecoratorDataToJson(code: string) {
      let result: any;

      await Tester.files({
        "mapToJson.js": mockFile.js({
          $jsonData(context: DecoratorContext, target: Type, value: TypeSpecValue) {
            result = typespecTypeToJson(value, target);
          },
        }),
      })
        .import("./mapToJson.js")
        .compile(`${code};`);
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
    function $bar(context: DecoratorContext, target: Type) {
      validateDecoratorUniqueOnNode(context, target, $bar);
    }

    const UniqueDecTester = Tester.files({
      "lib.js": mockFile.js({
        $bar,
      }),
    }).import("./lib.js");

    it("emit diagnostics if using the same decorator on the same node", async () => {
      const diagnostics = await UniqueDecTester.diagnose(`
        @bar
        @bar
        model Foo {}
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "duplicate-decorator",
          message: "Decorator @bar cannot be used twice on the same declaration.",
        },
        {
          code: "duplicate-decorator",
          message: "Decorator @bar cannot be used twice on the same declaration.",
        },
      ]);
    });

    it("shouldn't emit diagnostic if decorator is used once only", async () => {
      const diagnostics = await UniqueDecTester.diagnose(`
        @bar
        model Foo {}
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("shouldn't emit diagnostic if decorator is defined twice via `model is`", async () => {
      const diagnostics = await UniqueDecTester.diagnose(`
        @bar
        model Bar {}
        @bar
        model Foo is Bar;
      `);

      expectDiagnosticEmpty(diagnostics);
    });

    it("shouldn't emit diagnostic if decorator is used again as augment decorator", async () => {
      const diagnostics = await UniqueDecTester.diagnose(`
        @bar
        model Foo {}

        @@bar(Foo);
      `);

      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("validateDecoratorNotOnType", () => {
    function $red(context: DecoratorContext, target: Type) {
      validateDecoratorNotOnType(context, target, $blue, $red);
    }
    function $blue(context: DecoratorContext, target: Type) {
      validateDecoratorNotOnType(context, target, $red, $blue);
    }

    const ConflictDecTester = Tester.files({
      "lib.js": mockFile.js({
        $red,
        $blue,
      }),
    }).import("./lib.js");

    it("emit diagnostics if using the decorator has a conflict", async () => {
      const diagnostics = await ConflictDecTester.diagnose(`
        @red
        @blue
        model Foo {}
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-conflict",
        },
        {
          code: "decorator-conflict",
        },
      ]);
    });

    it("emit diagnostics if using the decorator has a conflict with model is", async () => {
      const diagnostics = await ConflictDecTester.diagnose(`
        @red
        model Bar {}
        @blue
        model Foo is Bar;
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-conflict",
        },
        {
          code: "decorator-conflict",
        },
      ]);
    });

    it("emit diagnostics if using the decorator has a conflict with model extends", async () => {
      const diagnostics = await ConflictDecTester.diagnose(`
        @red
        model Bar {}
        @blue
        model Foo extends Bar {};
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-conflict",
        },
      ]);
    });

    it("emit diagnostics if using the decorator has a conflict with scalar extends", async () => {
      const diagnostics = await ConflictDecTester.diagnose(`
        @red
        scalar foo extends int32;
        @blue
        scalar bar extends foo;
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-conflict",
        },
      ]);
    });

    it("should emit diagnostic if decorator conflict is created via augment decorator", async () => {
      const diagnostics = await ConflictDecTester.diagnose(`
        @red
        model Foo {}

        @@blue(Foo);
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-conflict",
        },
        {
          code: "decorator-conflict",
        },
      ]);
    });
  });
});
