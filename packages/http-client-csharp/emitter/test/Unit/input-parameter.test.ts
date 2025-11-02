vi.resetModules();

import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { InputParameterScope } from "../../src/type/input-parameter-scope.js";
import {
  InputBodyParameter,
  InputHeaderParameter,
  InputPathParameter,
  InputQueryParameter,
} from "../../src/type/input-type.js";
import { RequestLocation } from "../../src/type/request-location.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Test Parameter Explode", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  describe("path parameters", () => {
    describe("using simple expansion", () => {
      it("is true with primitive parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: "a"
                Expected path: /primitivea
            """)
            @route("primitive{param*}")
            op primitive(param: string): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/primitive{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "string");
        strictEqual(inputParam.kind, "path");
        strictEqual(inputParam.explode, true);
      });

      it("is true with array parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: ["a","b"]
                Expected path: /array/a,b
            """)
            @route("array{param*}")
            op arrayOp(param: string[]): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/array{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "array");
        strictEqual(inputParam.kind, "path");
        strictEqual(inputParam.explode, true);
      });

      it("is true with record parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: {a: 1, b: 2}
                Expected path: /record/a=1,b=2
            """)
            @route("record{param*}")
            op recordOp(param: Record<int32>): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/record{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "dict");
        strictEqual(inputParam.kind, "path");

        const inputPathParam = inputParam as InputPathParameter;
        strictEqual(inputPathParam.explode, true);
      });
    });

    describe("using path expansion", () => {
      it("is true with primitive parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: "a"
                Expected path: /primitive/a
            """)
            @route("primitive{/param*}")
            op primitive(param: string): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/primitive{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "string");
        strictEqual(inputParam.kind, "path");
        strictEqual(inputParam.explode, true);
      });

      it("is true with array parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: ["a","b"]
                Expected path: /array/a/b
            """)
            @route("array{/param*}")
            op arrayOp(param: string[]): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/array{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "array");
        strictEqual(inputParam.kind, "path");
        strictEqual(inputParam.explode, true);
      });

      it("is true with record parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: {a: 1, b: 2}
                Expected path: /record/a=1/b=2
            """)
            @route("record{/param*}")
            op recordOp(param: Record<int32>): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/record{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "dict");
        strictEqual(inputParam.kind, "path");
        strictEqual(inputParam.explode, true);
      });
    });

    describe("using label expansion", () => {
      it("is true with primitive parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: "a"
                Expected path: /primitive.a
            """)
            @route("primitive{.param*}")
            op primitive(param: string): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/primitive{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "string");
        strictEqual(inputParam.kind, "path");
        strictEqual(inputParam.explode, true);
      });

      it("is true with array parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: ["a","b"]
                Expected path: /array.a.b
            """)
            @route("array{.param*}")
            op arrayOp(param: string[]): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/array{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "array");
        strictEqual(inputParam.kind, "path");
        strictEqual(inputParam.explode, true);
      });

      it("is true with record parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: {a: 1, b: 2}
                Expected path: /record.a=1.b=2
            """)
            @route("record{.param*}")
            op recordOp(param: Record<int32>): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/record{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "dict");
        strictEqual(inputParam.kind, "path");
        strictEqual(inputParam.explode, true);
      });
    });

    describe("using matrix expansion", () => {
      it("is true with primitive parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: "a"
                Expected path: /primitive;param=a
            """)
            @route("primitive{;param*}")
            op primitive(param: string): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/primitive{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "string");
        strictEqual(inputParam.kind, "path");
        strictEqual(inputParam.explode, true);
      });

      it("is true with array parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: ["a","b"]
                Expected path: /array;param=a;param=b
            """)
            @route("array{;param*}")
            op arrayOp(param: string[]): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/array{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "array");
        strictEqual(inputParam.kind, "path");
        strictEqual(inputParam.explode, true);
      });

      it("is true with record parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: {a: 1, b: 2}
                Expected path: /record;a=1;b=2
            """)
            @route("record{;param*}")
            op recordOp(param: Record<int32>): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/record{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "dict");
        strictEqual(inputParam.kind, "path");
        strictEqual(inputParam.explode, true);
      });
    });
  });

  describe("query parameters", () => {
    describe("using query expansion", () => {
      it("is true with primitive parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: "a"
                Expected path: /primitive?param=a
            """)
            @route("primitive{?param*}")
            op primitive(param: string): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/primitive");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "string");
        strictEqual(inputParam.kind, "query");
        strictEqual(inputParam.explode, true);
        strictEqual(inputParam.arraySerializationDelimiter, undefined);
      });

      it("is true with array parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: ["a","b"]
                Expected path: /array?param=a&param=b
            """)
            @route("array{?param*}")
            op arrayOp(param: string[]): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/array");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "array");
        strictEqual(inputParam.kind, "query");
        strictEqual(inputParam.explode, true);
        strictEqual(inputParam.arraySerializationDelimiter, undefined);
      });

      it("is true with record parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: {a: 1, b: 2}
                Expected path: /record?a=1&b=2
            """)
            @route("record{?param*}")
            op recordOp(param: Record<int32>): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/record");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "dict");
        strictEqual(inputParam.kind, "query");
        strictEqual(inputParam.explode, true);
        strictEqual(inputParam.arraySerializationDelimiter, undefined);
      });
    });

    describe("query continuation", () => {
      it("is true with primitive parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: "a"
                Expected path: /primitive?fixed=true&param=a
            """)
            @route("primitive?fixed=true{&param*}")
            op primitive(param: string): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/primitive?fixed=true");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "string");
        strictEqual(inputParam.kind, "query");
        strictEqual(inputParam.explode, true);
        strictEqual(inputParam.arraySerializationDelimiter, undefined);
      });

      it("is true with array parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: ["a","b"]
                Expected path: /array?fixed=true&param=a&param=b
            """)
            @route("array?fixed=true{&param*}")
            op arrayOp(param: string[]): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/array?fixed=true");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "array");
        strictEqual(inputParam.kind, "query");
        strictEqual(inputParam.explode, true);
        strictEqual(inputParam.arraySerializationDelimiter, undefined);
      });

      it("is true with record parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: {a: 1, b: 2}
                Expected path: /record?fixed=true&a=1&b=2
            """)
            @route("record?fixed=true{&param*}")
            op recordOp(param: Record<int32>): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.clients[0].methods[0].operation.parameters.filter(
          (p) => p.name === "param",
        );
        const route = root.clients[0].methods[0].operation.path;

        strictEqual(route, "/record?fixed=true");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.type;

        strictEqual(type.kind, "dict");
        strictEqual(inputParam.kind, "query");
        strictEqual(inputParam.explode, true);
        strictEqual(inputParam.arraySerializationDelimiter, undefined);
      });
    });
  });
});

describe("Test Cookie Parameters", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  describe("Cookie parameter not supported", () => {
    it("cookie parameter is not supported", async () => {
      const program = await typeSpecCompile(
        `
              @route("test")
              op test(@cookie cookie: string): NoContentResponse;
        `,
        runner,
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const diagnostics = context.program.diagnostics;
      createModel(sdkContext);

      const unsupportedCookie = diagnostics.find(
        (d) => d.code === "@typespec/http-client-csharp/unsupported-cookie-parameter",
      );
      ok(unsupportedCookie);
      strictEqual(
        unsupportedCookie.message,
        "Cookie parameter is not supported: cookie, found in operation /test",
      );
    });
  });
});

describe("Endpoint parameters", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("Multiple parameters are not supported", async () => {
    const program = await typeSpecCompile(
      `
              @service(#{
                title: "Azure Csharp emitter Testing",
              })
              @server(
              "https://{param1}{param2}/",
              "Test endpoint",
              {
                param1: string,
                param2: string
              })
              namespace Test;

              op test() : void;
        `,
      runner,
      { IsNamespaceNeeded: false },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const diagnostics = context.program.diagnostics;
    createModel(sdkContext);

    const unsupportedCookie = diagnostics.find(
      (d) => d.code === "@typespec/http-client-csharp/unsupported-endpoint-url",
    );
    ok(unsupportedCookie);
    strictEqual(
      unsupportedCookie.message,
      "Unsupported server endpoint URL: https://{param1}{param2}/",
    );
  });
  it("String endpoint parameter has correct type", async () => {
    const program = await typeSpecCompile(
      `
              @service(#{
                title: "Azure Csharp emitter Testing",
              })
              @server(
              "https://{param1}",
              "Test endpoint",
              {
                param1: string,
              })
              namespace Test;

              op test() : void;
        `,
      runner,
      { IsNamespaceNeeded: false },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const codeModel = createModel(sdkContext);
    const client = codeModel.clients[0];
    ok(client);
    ok(client.parameters);

    strictEqual(client.parameters.length, 1);

    const endpointParameter = client.parameters[0];
    ok(endpointParameter);
    strictEqual(endpointParameter.kind, "endpoint");
    strictEqual(endpointParameter.type.kind, "string");
    strictEqual(endpointParameter.type.crossLanguageDefinitionId, "TypeSpec.string");
    strictEqual(endpointParameter.serverUrlTemplate, "https://{param1}");
  });

  it("URL endpoint parameter has correct type", async () => {
    const program = await typeSpecCompile(
      `
              @service(#{
                title: "Azure Csharp emitter Testing",
              })
              @server(
              "{param1}",
              "Test endpoint",
              {
                param1: url,
              })
              namespace Test;

              op test() : void;
        `,
      runner,
      { IsNamespaceNeeded: false },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const codeModel = createModel(sdkContext);
    const client = codeModel.clients[0];
    ok(client);
    ok(client.parameters);

    strictEqual(client.parameters.length, 1);

    const endpointParameter = client.parameters[0];
    ok(endpointParameter);
    strictEqual(endpointParameter.kind, "endpoint");
    strictEqual(endpointParameter.type.kind, "url");
    strictEqual(endpointParameter.type.crossLanguageDefinitionId, "TypeSpec.url");
    strictEqual(endpointParameter.serverUrlTemplate, "{param1}");
  });
});

describe("Test Spread Parameters", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("Spread parameters are present in service method", async () => {
    const program = await typeSpecCompile(
      `
        model Test {
          foo: string;
          bar: int32;
        }

        op test(...Test): void;
        `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    ok(root);

    // validate service method
    const serviceMethod = root.clients[0].methods[0];
    ok(serviceMethod);
    strictEqual(serviceMethod.parameters.length, 3);

    const fooParam = serviceMethod.parameters.find((p) => p.name === "foo");
    ok(fooParam);
    strictEqual(fooParam.location, RequestLocation.Body);

    const barParam = serviceMethod.parameters.find((p) => p.name === "bar");
    ok(barParam);
    strictEqual(barParam.location, RequestLocation.Body);

    // validate operation
    const operation = serviceMethod.operation;
    ok(operation);

    strictEqual(operation.parameters.length, 2);
    const contentTypeParam = operation.parameters.find((p) => p.name === "contentType");
    ok(contentTypeParam);

    const testParam = operation.parameters.find((p) => p.name === "test");
    ok(testParam);
    strictEqual(testParam.kind, "body");
    strictEqual(testParam.scope, InputParameterScope.Spread);
  });

  it("Parameters that are constants", async () => {
    const program = await typeSpecCompile(
      `
        model Animal {
          name: string;
          kind: "cat";
      }
        op anonymousBody(...Animal): void;
        `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    ok(root);

    // validate service method
    const serviceMethod = root.clients[0].methods[0];
    ok(serviceMethod);
    strictEqual(serviceMethod.parameters.length, 3);

    const kindParam = serviceMethod.parameters.find((p) => p.name === "kind");
    ok(kindParam);
    strictEqual(kindParam.location, RequestLocation.Body);
    strictEqual(kindParam.type.kind, "constant");
    strictEqual(kindParam.type.valueType.kind, "string");

    const nameParam = serviceMethod.parameters.find((p) => p.name === "name");
    ok(nameParam);
    strictEqual(nameParam.location, RequestLocation.Body);
    strictEqual(nameParam.type.kind, "string");

    // validate operation
    const operation = serviceMethod.operation;
    ok(operation);

    strictEqual(operation.parameters.length, 2);
    const contentTypeParam = operation.parameters.find((p) => p.name === "contentType");
    ok(contentTypeParam);

    const testParam = operation.parameters.find((p) => p.name === "animal");
    ok(testParam);
    strictEqual(testParam.type.kind, "model");
    strictEqual(testParam.kind, "body");
    strictEqual(testParam.scope, InputParameterScope.Spread);
  });
});

describe("Test Operation Parameters", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  describe("Query parameters", () => {
    it("should return InputQueryParameter for query parameter", async () => {
      const program = await typeSpecCompile(
        `
          @route("test")
          op test(@query queryParam: string): void;
        `,
        runner,
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const operation = root.clients[0].methods[0].operation;
      const queryParam = operation.parameters.find((p) => p.name === "queryParam");

      ok(queryParam);
      strictEqual(queryParam.kind, "query");

      const typedParam = queryParam as InputQueryParameter;
      strictEqual(typedParam.explode, false);
      strictEqual(typedParam.type.kind, "string");
      strictEqual(typedParam.serializedName, "queryParam");
    });
  });

  describe("Path parameters", () => {
    it("should return InputPathParameter for path parameter", async () => {
      const program = await typeSpecCompile(
        `
          @route("test/{pathParam}")
          op test(@path pathParam: string): void;
        `,
        runner,
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const operation = root.clients[0].methods[0].operation;
      const pathParam = operation.parameters.find((p) => p.name === "pathParam");

      ok(pathParam);
      strictEqual(pathParam.kind, "path");

      const typedParam = pathParam as InputPathParameter;
      strictEqual(typedParam.explode, false);
      strictEqual(typedParam.style, "simple");
      strictEqual(typedParam.allowReserved, false);
      strictEqual(typedParam.skipUrlEncoding, false);
      strictEqual(typedParam.type.kind, "string");
      strictEqual(typedParam.serializedName, "pathParam");
    });
  });

  describe("Header parameters", () => {
    it("should return InputHeaderParameter for header parameter", async () => {
      const program = await typeSpecCompile(
        `
          @route("test")
          op test(@header headerParam: string): void;
        `,
        runner,
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const operation = root.clients[0].methods[0].operation;
      const headerParam = operation.parameters.find((p) => p.name === "headerParam");

      ok(headerParam);
      strictEqual(headerParam.kind, "header");

      const typedParam = headerParam as InputHeaderParameter;
      strictEqual(typedParam.isContentType, false);
      strictEqual(typedParam.type.kind, "string");
      // Header names are normalized to kebab-case by the SDK
      strictEqual(typedParam.serializedName, "header-param");
    });

    it("should identify content-type header parameter", async () => {
      const program = await typeSpecCompile(
        `
          model TestModel {
            name: string;
          }
          
          @route("test")
          @post
          op test(@header contentType: "application/json", @body body: TestModel): void;
        `,
        runner,
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const operation = root.clients[0].methods[0].operation;
      const contentTypeParam = operation.parameters.find((p) => p.name === "contentType");

      ok(contentTypeParam);
      strictEqual(contentTypeParam.kind, "header");

      const typedParam = contentTypeParam as InputHeaderParameter;
      strictEqual(typedParam.isContentType, true);
      strictEqual(typedParam.type.kind, "constant");
    });
  });

  describe("Body parameters", () => {
    it("should return InputBodyParameter for body parameter", async () => {
      const program = await typeSpecCompile(
        `
          model TestModel {
            name: string;
            value: int32;
          }
          
          @route("test")
          op test(@body bodyParam: TestModel): void;
        `,
        runner,
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const operation = root.clients[0].methods[0].operation;
      const bodyParam = operation.parameters.find((p) => p.name === "bodyParam");

      ok(bodyParam);
      strictEqual(bodyParam.kind, "body");

      const typedParam = bodyParam as InputBodyParameter;
      strictEqual(typedParam.type.kind, "model");
      strictEqual(typedParam.serializedName, "bodyParam");
      ok(typedParam.contentTypes.includes("application/json"));
    });
  });

  describe("correspondingMethodParams", () => {
    it("should map body parameter to corresponding method parameters when spread", async () => {
      const program = await typeSpecCompile(
        `
          model TestModel {
            name: string;
            value: int32;
          }
          
          @route("test")
          op test(...TestModel): void;
        `,
        runner,
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const operation = root.clients[0].methods[0].operation;
      const bodyParam = operation.parameters.find((p) => p.kind === "body");

      ok(bodyParam);
      strictEqual(bodyParam.kind, "body");

      const typedParam = bodyParam as InputBodyParameter;
      ok(typedParam.correspondingMethodParams);
      strictEqual(typedParam.correspondingMethodParams.length, 2);
      ok(typedParam.correspondingMethodParams.some((p) => p.name === "name"));
      ok(typedParam.correspondingMethodParams.some((p) => p.name === "value"));
    });

    it("should have empty correspondingMethodParams for non-spread body parameter", async () => {
      const program = await typeSpecCompile(
        `
          model TestModel {
            name: string;
            value: int32;
          }
          
          @route("test")
          op test(@body body: TestModel): void;
        `,
        runner,
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const operation = root.clients[0].methods[0].operation;
      const bodyParam = operation.parameters.find((p) => p.kind === "body");

      ok(bodyParam);
      strictEqual(bodyParam.kind, "body");

      const typedParam = bodyParam as InputBodyParameter;
      // When not spread, correspondingMethodParams should be empty or contain just the body parameter itself
      ok(typedParam.correspondingMethodParams === undefined || typedParam.correspondingMethodParams.length <= 1);
    });
  });
});
