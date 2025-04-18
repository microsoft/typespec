vi.resetModules();

import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Test string format", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("scalar url as parameter", async () => {
    const program = await typeSpecCompile(
      `
            op test(@path sourceUrl: url): void;
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
      (p) => p.name === "sourceUrl",
    );
    strictEqual(1, inputParamArray.length);
    const type = inputParamArray[0].type;
    strictEqual(type.kind, "url");
  });

  it("scalar url as model property", async () => {
    const program = await typeSpecCompile(
      `
            @doc("This is a model.")
            model Foo {
                @doc("The source url.")
                source: url;
            }

            op test(@body foo: Foo): void;
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const codeModel = createModel(sdkContext);
    const models = codeModel.models;
    const foo = models.find((m) => m.name === "Foo");
    ok(foo);
    const type = foo?.properties[0].type;
    strictEqual(type.kind, "url");
  });
});
