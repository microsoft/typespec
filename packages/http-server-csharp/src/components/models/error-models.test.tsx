import { Tester } from "#test/tester.js";
import { render, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { Output } from "@typespec/emitter-framework";
import { beforeEach, expect, it } from "vitest";
import { EmitterOptions } from "../../context/emitter-options-context.js";
import { efRefkey } from "../type-expression/type-expression.jsx";
import { getErrorConstructor } from "./error-models.jsx";
import { Models } from "./models.jsx";

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

function Wrapper(props: { children: Children }) {
  return (
    <Output program={runner.program} namePolicy={cs.createCSharpNamePolicy()}>
      <EmitterOptions.Provider value={{ collectionType: "array", serviceNamespace: "Test" }}>
        <cs.SourceFile path="test.cs">{props.children}</cs.SourceFile>
      </EmitterOptions.Provider>
    </Output>
  );
}

function findFileContent(output: any, pathSuffix: string): string | undefined {
  function search(dir: any): string | undefined {
    for (const item of dir.contents) {
      if (
        "contents" in item &&
        typeof item.contents === "string" &&
        (item.path === pathSuffix || item.path.endsWith("/" + pathSuffix))
      ) {
        return item.contents;
      }
      if ("contents" in item && Array.isArray(item.contents)) {
        const found = search(item);
        if (found) return found;
      }
    }
    return undefined;
  }
  return search(output);
}

it("maps structured error constructor parameters to their property types", async () => {
  const { ApiError } = await runner.compile(t.code`
    @error
    model ${t.model("ApiError")} {
      message: string;
      context: string | null;
      param?: string;
      details?: ApiError[];
      additionalInfo?: Record<unknown>;
      counts?: Record<int32>;
      pair?: [string, string];
      count?: int32;
      retryAfter?: int32 | null;
    }
  `);

  expect(
    <Wrapper>
      <cs.ClassDeclaration name="ApiError" refkey={efRefkey(ApiError)}>
        {getErrorConstructor(runner.program, ApiError, "ApiError")}
      </cs.ClassDeclaration>
    </Wrapper>,
  ).toRenderTo(`
    class ApiError
    {
        public ApiError(
            string message,
            string? context,
            string? param = default,
            ApiError[]? details = default,
            JsonObject? additionalInfo = default,
            IDictionary<string, int>? counts = default,
            string[]? pair = default,
            int? count = default,
            int? retryAfter = default
        ) : base(
            400,
            value: new { message = message, context = context, param = param, details = details, additionalInfo = additionalInfo, counts = counts, pair = pair, count = count, retryAfter = retryAfter }
        )
        {
            MessageProp = message;
            Context = context;
            Param = param;
            Details = details;
            AdditionalInfo = additionalInfo;
            Counts = counts;
            Pair = pair;
            Count = count;
            RetryAfter = retryAfter;
        }
    }
  `);
});

it("adds the JsonObject using for inherited record error constructor parameters", async () => {
  const { Base, ApiError } = await runner.compile(t.code`
    model ${t.model("Base")} {
      data?: Record<unknown>[];
      nestedData?: Record<Record<unknown>>;
    }

    @error
    model ${t.model("ApiError")} extends Base {
      message: string;
    }
  `);

  const output = render(
    <Output program={runner.program} namePolicy={cs.createCSharpNamePolicy()}>
      <EmitterOptions.Provider value={{ collectionType: "array", serviceNamespace: "Test" }}>
        <Models models={[Base, ApiError]} serviceNamespace={undefined} />
      </EmitterOptions.Provider>
    </Output>,
  );
  const apiErrorFile = findFileContent(output, "ApiError.cs");

  expect(apiErrorFile).toBeDefined();
  expect(apiErrorFile).toContain("using System.Text.Json.Nodes;");
  expect(apiErrorFile).toContain("IDictionary<string, JsonObject>? nestedData = default");
});
