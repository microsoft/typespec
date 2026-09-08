import { Tester } from "#test/tester.js";
import { render } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { Output } from "@typespec/emitter-framework";
import { beforeEach, expect, it } from "vitest";
import { EmitterOptions } from "../../context/emitter-options-context.js";
import { Models } from "./models.jsx";

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

function findFileContent(output: any, pathSuffix: string): string | undefined {
  function search(directory: any): string | undefined {
    for (const item of directory.contents) {
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

function renderModel(model: import("@typespec/compiler").Model): string | undefined {
  const output = render(
    <Output program={runner.program} namePolicy={cs.createCSharpNamePolicy()}>
      <EmitterOptions.Provider value={{ collectionType: "array", serviceNamespace: "Test" }}>
        <Models models={[model]} serviceNamespace={undefined} />
      </EmitterOptions.Provider>
    </Output>,
  );

  return findFileContent(output, `${model.name}.cs`);
}

it("makes optional error properties and constructor parameters nullable", async () => {
  const { ApiError } = await runner.compile(t.code`
    @error
    model ${t.model("ApiError")} {
      message: string;
      optionalText?: string;
      optionalCount?: int32;
    }
  `);

  const content = renderModel(ApiError);

  expect(content).toContain("string? optionalText = default");
  expect(content).toContain("int? optionalCount = default");
  expect(content).toContain("public string? OptionalText { get; set; }");
  expect(content).toContain("public int? OptionalCount { get; set; }");
});

it("emits one nullable suffix for explicitly nullable error properties", async () => {
  const { ApiError } = await runner.compile(t.code`
    @error
    model ${t.model("ApiError")} {
      context: string | null;
      count: int32 | null;
      optionalContext?: string | null;
    }
  `);

  const content = renderModel(ApiError);

  expect(content).toContain("string? context");
  expect(content).toContain("int? count");
  expect(content).toContain("string? optionalContext = default");
  expect(content).toContain("public string? Context { get; set; }");
  expect(content).toContain("public int? Count { get; set; }");
  expect(content).toContain("public string? OptionalContext { get; set; }");
  expect(content).not.toContain("??");
});

it("keeps optional non-error reference properties unchanged", async () => {
  const { Widget } = await runner.compile(t.code`
    model ${t.model("Widget")} {
      optionalText?: string;
    }
  `);

  const content = renderModel(Widget);

  expect(content).toContain("public string OptionalText { get; set; }");
  expect(content).not.toContain("public string? OptionalText { get; set; }");
});
