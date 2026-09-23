vi.resetModules();

import {
  expectDiagnosticEmpty,
  expectDiagnostics,
  type TestHost,
} from "@typespec/compiler/testing";
import { HttpClientTestLibrary } from "@typespec/http-client/testing";
import { deepStrictEqual, strictEqual } from "assert";
import { ok } from "assert/strict";
import { beforeEach, describe, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Test emitting decorator list", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  describe("experimental declarations", () => {
    beforeEach(async () => {
      await runner.addTypeSpecLibrary(HttpClientTestLibrary);
    });

    describe.each(["diagnosticId", "dependsOn"])("validating %s", (field) => {
      it.each([
        "",
        " ",
        "A B",
        "A,B",
        "A-B",
        "A.B",
        "1A",
        "@A",
        "A\n",
        "A\r",
        "A\tB",
        "A//B",
        "A/*B*/",
        "A\n#pragma warning disable",
      ])("rejects invalid ID %j", async (id) => {
        const value = field === "dependsOn" ? `#[${JSON.stringify(id)}]` : JSON.stringify(id);
        const program = await typeSpecCompile(
          `@TypeSpec.HttpClient.experimental(#{ ${field}: ${value} }) op read(): void;`,
          runner,
          { IsHttpClientNeeded: true },
        );
        const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
        const [, diagnostics] = createModel(sdkContext);
        expectDiagnostics(diagnostics, {
          code: "@typespec/http-client-csharp/invalid-experimental-diagnostic-id",
        });
      });
    });

    it.each(["A", "DEP001", "_DEP001", "CS0618", "0618", "class"])(
      "accepts pragma identifier %s",
      async (id) => {
        const program = await typeSpecCompile(
          `@TypeSpec.HttpClient.experimental(#{ diagnosticId: "${id}", dependsOn: #["${id}"] }) op read(): void;`,
          runner,
          { IsHttpClientNeeded: true },
        );
        const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
        const [root, diagnostics] = createModel(sdkContext);
        expectDiagnosticEmpty(diagnostics);
        deepStrictEqual(root.clients[0].methods[0].operation.experimental, {
          diagnosticId: id,
          dependsOn: [id],
        });
      },
    );

    const declarations = [
      {
        name: "model",
        code: `DECORATOR model Payload { value: string; } op read(): Payload;`,
        select: (root: ReturnType<typeof createModel>[0]) => root.models[0],
      },
      {
        name: "model property",
        code: `model Payload { DECORATOR value: string; } op read(): Payload;`,
        select: (root: ReturnType<typeof createModel>[0]) => root.models[0].properties[0],
      },
      {
        name: "enum",
        code: `DECORATOR enum Choice { One, Two } op read(): Choice;`,
        select: (root: ReturnType<typeof createModel>[0]) => root.enums[0],
      },
      {
        name: "enum member",
        code: `enum Choice { DECORATOR One, Two } op read(): Choice;`,
        select: (root: ReturnType<typeof createModel>[0]) => root.enums[0].values[0],
      },
      {
        name: "extensible enum",
        code: `DECORATOR union Choice { string, One: "one", Two: "two" } op read(): Choice;`,
        select: (root: ReturnType<typeof createModel>[0]) => root.enums[0],
      },
      {
        name: "union variant",
        code: `union Choice { string, DECORATOR One: "one", Two: "two" } op read(): Choice;`,
        select: (root: ReturnType<typeof createModel>[0]) => root.enums[0].values[0],
      },
      {
        name: "interface client",
        code: `DECORATOR interface Group { @route("/read") read(): void; }`,
        select: (root: ReturnType<typeof createModel>[0]) => root.clients[0].children![0],
      },
      {
        name: "namespace client",
        code: `DECORATOR namespace Group { @route("/read") op read(): void; }`,
        select: (root: ReturnType<typeof createModel>[0]) => root.clients[0].children![0],
      },
    ];

    describe.each(declarations)("$name", ({ code, select }) => {
      it.each([
        { scope: "@typespec/http-client-csharp", applies: true },
        { scope: "other-emitter", applies: false },
        { scope: "!other-emitter", applies: true },
      ])("preserves scoped metadata for $scope", async ({ scope, applies }) => {
        const decorator = `@TypeSpec.HttpClient.experimental(#{
          emitterScope: "${scope}", diagnosticId: "TEST001", dependsOn: #["DEP001", "DEP002"]
        })`;
        const program = await typeSpecCompile(code.replace("DECORATOR", decorator), runner, {
          IsHttpClientNeeded: true,
        });
        const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
        expectDiagnosticEmpty(sdkContext.diagnostics);
        const [root, diagnostics] = createModel(sdkContext);
        expectDiagnosticEmpty(diagnostics);
        deepStrictEqual(
          select(root).experimental,
          applies ? { diagnosticId: "TEST001", dependsOn: ["DEP001", "DEP002"] } : undefined,
        );
      });
    });

    it.each([
      `@TypeSpec.HttpClient.experimental(#{ diagnosticId: "SCALAR001" })
       scalar CustomString extends string; op read(): CustomString;`,
      `op read(@TypeSpec.HttpClient.experimental(#{ diagnosticId: "PARAM001" })
       @query value: string): void;`,
      `@TypeSpec.HttpClient.experimental(#{ diagnosticId: "UNION001" })
       union Choice { text: string, count: int32 } op read(): Choice;`,
      `union Choice {
         @TypeSpec.HttpClient.experimental(#{ diagnosticId: "VARIANT001" })
         text: string, count: int32
       } op read(): Choice;`,
    ])("reports annotations with no supported C# declaration", async (code) => {
      const program = await typeSpecCompile(code, runner, { IsHttpClientNeeded: true });
      const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
      const [, diagnostics] = createModel(sdkContext);
      expectDiagnostics(diagnostics, {
        code: "@typespec/http-client-csharp/experimental-target-not-supported",
      });
    });

    it.each([
      { scope: undefined, applies: true },
      { scope: "@typespec/http-client-csharp", applies: true },
      { scope: "other-emitter, @typespec/http-client-csharp", applies: true },
      { scope: "other-emitter", applies: false },
      { scope: "!other-emitter", applies: true },
      { scope: "!@typespec/http-client-csharp", applies: false },
      { scope: "!other-emitter, !@typespec/http-client-csharp", applies: false },
    ])("respects emitter scope $scope", async ({ scope, applies }) => {
      const program = await typeSpecCompile(
        `
        @TypeSpec.HttpClient.experimental(#{
          ${scope === undefined ? "" : `emitterScope: "${scope}",`}
          diagnosticId: "C",
          dependsOn: #["A", "B"]
        })
        op bar(): void;
        `,
        runner,
        { IsHttpClientNeeded: true },
      );
      expectDiagnosticEmpty(program.diagnostics);
      const sdkContext = await createCSharpSdkContext(createEmitterContext(program), {
        additionalDecorators: [],
      });
      expectDiagnosticEmpty(sdkContext.diagnostics);
      const [root, diagnostics] = createModel(sdkContext);
      expectDiagnosticEmpty(diagnostics);
      deepStrictEqual(
        root.clients[0].methods[0].operation.experimental,
        applies ? { diagnosticId: "C", dependsOn: ["A", "B"] } : undefined,
      );
    });

    it.each([
      { decorator: "", expected: undefined },
      {
        decorator: "@TypeSpec.HttpClient.experimental",
        expected: { diagnosticId: undefined, dependsOn: [] },
      },
      {
        decorator: '@TypeSpec.HttpClient.experimental(#{ diagnosticId: "C" })',
        expected: { diagnosticId: "C", dependsOn: [] },
      },
      {
        decorator: '@TypeSpec.HttpClient.experimental(#{ dependsOn: #["A"] })',
        expected: { diagnosticId: undefined, dependsOn: ["A"] },
      },
      {
        decorator: '@TypeSpec.HttpClient.experimental(#{ diagnosticId: "C", dependsOn: #[] })',
        expected: { diagnosticId: "C", dependsOn: [] },
      },
    ])("preserves optional metadata for $decorator", async ({ decorator, expected }) => {
      const program = await typeSpecCompile(`${decorator} op bar(): void;`, runner, {
        IsHttpClientNeeded: true,
      });
      expectDiagnosticEmpty(program.diagnostics);
      const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
      const [root, diagnostics] = createModel(sdkContext);
      expectDiagnosticEmpty(diagnostics);
      deepStrictEqual(root.clients[0].methods[0].operation.experimental, expected);
    });
  });

  it("emit decorator list on a client", async () => {
    const program = await typeSpecCompile(
      `
      @clientName("CsharpBookClient")
      interface BookClient {
        op test(): void;
      }
      `,
      runner,
      { IsTCGCNeeded: true, IsXmlNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context, {
      additionalDecorators: ["Azure\\.ClientGenerator\\.Core\\.@clientName"],
    });
    const [root] = createModel(sdkContext);
    const clients = root.clients;
    strictEqual(clients.length, 1);
    ok(clients[0].children);
    strictEqual(clients[0].children.length, 1);
    const childClient = clients[0].children[0];
    deepStrictEqual(childClient.decorators, [
      {
        name: "Azure.ClientGenerator.Core.@clientName",
        arguments: {
          rename: "CsharpBookClient",
        },
      },
    ]);
  });

  it("emit decorator list on a operation", async () => {
    const program = await typeSpecCompile(
      `
      model Book {
        content: string;
      }
      @clientName("ClientTestOperation")
      op test(): Book;
      `,
      runner,
      { IsTCGCNeeded: true, IsXmlNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context, {
      additionalDecorators: ["Azure\\.ClientGenerator\\.Core\\.@clientName"],
    });
    const [root] = createModel(sdkContext);
    const methods = root.clients[0].methods;
    strictEqual(methods.length, 1);
    const operation = methods[0].operation;
    deepStrictEqual(operation.decorators, [
      {
        name: "Azure.ClientGenerator.Core.@clientName",
        arguments: {
          rename: "ClientTestOperation",
        },
      },
    ]);
  });

  it("emit decorator list on a model", async () => {
    const program = await typeSpecCompile(
      `
      @clientName("ClientBook")
      model Book {
        content: string;
      }

      op test(): Book;
      `,
      runner,
      { IsTCGCNeeded: true, IsXmlNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context, {
      additionalDecorators: ["Azure\\.ClientGenerator\\.Core\\.@clientName"],
    });
    const [root] = createModel(sdkContext);
    const models = root.models;
    strictEqual(models.length, 1);
    deepStrictEqual(models[0].decorators, [
      {
        name: "Azure.ClientGenerator.Core.@clientName",
        arguments: {
          rename: "ClientBook",
        },
      },
    ]);
  });

  it("does not convert model arguments on generic decorators to SDK models", async () => {
    const program = await typeSpecCompile(`op test(): void;`, runner);
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context, {
      additionalDecorators: ["TypeSpec\\.Http\\.@useAuth"],
    });

    expectDiagnostics(sdkContext.diagnostics, [
      {
        code: "@azure-tools/typespec-client-generator-core/unsupported-generic-decorator-arg-type",
      },
    ]);
    const [root] = createModel(sdkContext);
    strictEqual(root.models.length, 0);
  });

  it("preserves model arguments on clientOption decorators", async () => {
    const program = await typeSpecCompile(
      `
      model Options {
        enabled: boolean;
      }

      #suppress "@azure-tools/typespec-client-generator-core/client-option" "Testing model-valued client options."
      @clientOption("options", Options, "csharp")
      interface BookClient {
        op test(): void;
      }
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);

    expectDiagnosticEmpty(sdkContext.diagnostics);
    const [root] = createModel(sdkContext);
    const childClient = root.clients[0].children?.[0];
    ok(childClient);
    const decorator = childClient.decorators?.find(
      (decorator) => decorator.name === "Azure.ClientGenerator.Core.@clientOption",
    );
    ok(decorator);
    strictEqual(decorator.arguments.name, "options");
    const value = decorator.arguments.value;
    ok(value && typeof value === "object" && "kind" in value && "name" in value);
    strictEqual(value.kind, "model");
    strictEqual(value.name, "Options");
  });

  it("emit decorator list on a model property", async () => {
    const program = await typeSpecCompile(
      `
      model Book {
        @clientName("ClientContent")
        content: string;
      }

      op test(): Book;
      `,
      runner,
      { IsTCGCNeeded: true, IsXmlNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context, {
      additionalDecorators: ["Azure\\.ClientGenerator\\.Core\\.@clientName"],
    });
    const [root] = createModel(sdkContext);
    const models = root.models;
    strictEqual(models.length, 1);
    deepStrictEqual(models[0].properties[0].decorators, [
      {
        name: "Azure.ClientGenerator.Core.@clientName",
        arguments: {
          rename: "ClientContent",
        },
      },
    ]);
  });

  it("emit decorator list on a parameter", async () => {
    const program = await typeSpecCompile(
      `
      @clientName("ClientTestOperation")
      op test(@clientName("ClientId") @header id: string): void;
      `,
      runner,
      { IsTCGCNeeded: true, IsXmlNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context, {
      additionalDecorators: ["Azure\\.ClientGenerator\\.Core\\.@clientName"],
    });
    const [root] = createModel(sdkContext);
    const methods = root.clients[0].methods;
    strictEqual(methods.length, 1);
    const operation = methods[0].operation;
    const idParameters = operation.parameters.filter((p) => p.name === "ClientId");
    strictEqual(idParameters.length, 1);
    deepStrictEqual(idParameters[0].decorators, [
      {
        name: "Azure.ClientGenerator.Core.@clientName",
        arguments: {
          rename: "ClientId",
        },
      },
    ]);
  });
});
