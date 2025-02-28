import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
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
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/primitive{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "string");
        strictEqual(inputParam.Location, RequestLocation.Path);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
      });

      it("is true with array parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: ["a","b"]
                Expected path: /array/a,b
            """)
            @route("array{param*}")
            op array(param: string[]): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/array{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "array");
        strictEqual(inputParam.Location, RequestLocation.Path);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
      });

      it("is true with record parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: {a: 1, b: 2}
                Expected path: /record/a=1,b=2
            """)
            @route("record{param*}")
            op record(param: Record<int32>): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/record{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "dict");
        strictEqual(inputParam.Location, RequestLocation.Path);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
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
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/primitive{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "string");
        strictEqual(inputParam.Location, RequestLocation.Path);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
      });

      it("is true with array parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: ["a","b"]
                Expected path: /array/a/b
            """)
            @route("array{/param*}")
            op array(param: string[]): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/array{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "array");
        strictEqual(inputParam.Location, RequestLocation.Path);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
      });

      it("is true with record parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: {a: 1, b: 2}
                Expected path: /record/a=1/b=2
            """)
            @route("record{/param*}")
            op record(param: Record<int32>): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/record{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "dict");
        strictEqual(inputParam.Location, RequestLocation.Path);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
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
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/primitive{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "string");
        strictEqual(inputParam.Location, RequestLocation.Path);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
      });

      it("is true with array parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: ["a","b"]
                Expected path: /array.a.b
            """)
            @route("array{.param*}")
            op array(param: string[]): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/array{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "array");
        strictEqual(inputParam.Location, RequestLocation.Path);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
      });

      it("is true with record parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: {a: 1, b: 2}
                Expected path: /record.a=1.b=2
            """)
            @route("record{.param*}")
            op record(param: Record<int32>): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/record{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "dict");
        strictEqual(inputParam.Location, RequestLocation.Path);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
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
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/primitive{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "string");
        strictEqual(inputParam.Location, RequestLocation.Path);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
      });

      it("is true with array parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: ["a","b"]
                Expected path: /array;param=a;param=b
            """)
            @route("array{;param*}")
            op array(param: string[]): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/array{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "array");
        strictEqual(inputParam.Location, RequestLocation.Path);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
      });

      it("is true with record parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: {a: 1, b: 2}
                Expected path: /record;a=1;b=2
            """)
            @route("record{;param*}")
            op record(param: Record<int32>): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/record{param}");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "dict");
        strictEqual(inputParam.Location, RequestLocation.Path);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
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
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/primitive");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "string");
        strictEqual(inputParam.Location, RequestLocation.Query);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
      });

      it("is true with array parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: ["a","b"]
                Expected path: /array?param=a&param=b
            """)
            @route("array{?param*}")
            op array(param: string[]): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/array");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "array");
        strictEqual(inputParam.Location, RequestLocation.Query);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
      });

      it("is true with record parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: {a: 1, b: 2}
                Expected path: /record?a=1&b=2
            """)
            @route("record{?param*}")
            op record(param: Record<int32>): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/record");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "dict");
        strictEqual(inputParam.Location, RequestLocation.Query);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
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
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/primitive?fixed=true");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "string");
        strictEqual(inputParam.Location, RequestLocation.Query);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
      });

      it("is true with array parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: ["a","b"]
                Expected path: /array?fixed=true&param=a&param=b
            """)
            @route("array?fixed=true{&param*}")
            op array(param: string[]): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/array?fixed=true");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "array");
        strictEqual(inputParam.Location, RequestLocation.Query);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
      });

      it("is true with record parameter type", async () => {
        const program = await typeSpecCompile(
          `
            @doc("""
                Param value: {a: 1, b: 2}
                Expected path: /record?fixed=true&a=1&b=2
            """)
            @route("record?fixed=true{&param*}")
            op record(param: Record<int32>): void;
          `,
          runner,
        );
        const context = createEmitterContext(program);
        const sdkContext = await createCSharpSdkContext(context);
        const root = createModel(sdkContext);
        const inputParamArray = root.Clients[0].Operations[0].Parameters.filter(
          (p) => p.Name === "param",
        );
        const route = root.Clients[0].Operations[0].Path;

        strictEqual(route, "/record?fixed=true");
        strictEqual(1, inputParamArray.length);
        const inputParam = inputParamArray[0];
        const type = inputParam.Type;

        strictEqual(type.kind, "dict");
        strictEqual(inputParam.Location, RequestLocation.Query);
        strictEqual(inputParam.Explode, true);
        strictEqual(inputParam.ArraySerializationDelimiter, undefined);
      });
    });

    describe("Cookie parameter not supported", () => {
      let runner: TestHost;

      beforeEach(async () => {
        runner = await createEmitterTestHost();
      });

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

    describe("Unsupported endpoint url", () => {
      let runner: TestHost;

      beforeEach(async () => {
        runner = await createEmitterTestHost();
      });

      it("cookie parameter is not supported", async () => {
        const program = await typeSpecCompile(
          `
                @service({
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
    });
  });
});
