vi.resetModules();

import { DecoratorInfo } from "@azure-tools/typespec-client-generator-core";
import { strictEqual } from "assert";
import { describe, it, vi } from "vitest";
import { getAllModelDecorators } from "../../src/lib/type-converter.js";
import { InputNamespace } from "../../src/type/input-type.js";

describe("getAllModelDecorators", () => {
  it("parses all namespace decorators", async function () {
    const decoratorOne: DecoratorInfo = {
      name: "d1",
      arguments: {},
    };
    const decoratorTwo: DecoratorInfo = {
      name: "d2",
      arguments: {},
    };
    const modelDecorator: DecoratorInfo = {
      name: "modelDecorator",
      arguments: {},
    };
    const ns: InputNamespace = {
      name: "testNamespace",
      fullName: "parentNamespace.testNamespace",
      namespaces: [],
      decorators: [decoratorOne, decoratorTwo],
    };

    const allDecorators = getAllModelDecorators(ns, [modelDecorator]);
    strictEqual(allDecorators.length, 3);
    strictEqual(allDecorators[0].name, decoratorOne.name);
    strictEqual(allDecorators[1].name, decoratorTwo.name);
    strictEqual(allDecorators[2].name, modelDecorator.name);
  });
});
