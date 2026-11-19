import { Tester } from "#test/tester.js";
import { render, type Children } from "@alloy-js/core";
import { createCSharpNamePolicy, SourceFile } from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { Output } from "@typespec/emitter-framework";
import { ClassDeclaration } from "@typespec/emitter-framework/csharp";
import { HttpCanonicalizer } from "@typespec/http-canonicalization";
import { beforeEach, expect, it } from "vitest";
import { EmitterOptions } from "../../context/emitter-options-context.js";
import { resolveServiceTypes } from "../../service-resolution.js";
import { Models } from "./models.jsx";

let runner: TesterInstance;

beforeEach(async () => {
  runner = await Tester.createInstance();
});

function Wrapper(props: { children: Children }) {
  const policy = createCSharpNamePolicy();
  return (
    <Output program={runner.program} namePolicy={policy}>
      <SourceFile path="test.cs">{props.children}</SourceFile>
    </Output>
  );
}

function findFileContent(output: any, fileName: string): string | undefined {
  for (const item of output.contents) {
    if (
      "contents" in item &&
      typeof item.contents === "string" &&
      (item.path === fileName || item.path.endsWith(`/${fileName}`))
    ) {
      return item.contents;
    }
    if ("contents" in item && Array.isArray(item.contents)) {
      const found = findFileContent(item, fileName);
      if (found) return found;
    }
  }
  return undefined;
}

it("renders a simple model with properties", async () => {
  const { Pet } = await runner.compile(t.code`
    model ${t.model("Pet")} {
      name: string;
      age: int32;
    }
  `);

  expect(
    <Wrapper>
      <ClassDeclaration type={Pet} jsonAttributes />
    </Wrapper>,
  ).toRenderTo(`
    using System.Text.Json.Serialization;

    class Pet
    {
        [JsonPropertyName("name")]
        public required string Name { get; set; }

        [JsonPropertyName("age")]
        public required int Age { get; set; }
    }
  `);
});

it("renders a model with optional property", async () => {
  const { Pet } = await runner.compile(t.code`
    model ${t.model("Pet")} {
      name: string;
      tag?: string;
    }
  `);

  expect(
    <Wrapper>
      <ClassDeclaration type={Pet} jsonAttributes />
    </Wrapper>,
  ).toRenderTo(`
    using System.Text.Json.Serialization;

    class Pet
    {
        [JsonPropertyName("name")]
        public required string Name { get; set; }

        [JsonPropertyName("tag")]
        public string? Tag { get; set; }
    }
  `);
});

it("renders a model with inheritance", async () => {
  const { Pet, Dog } = await runner.compile(t.code`
    model ${t.model("Pet")} {
      name: string;
    }
    model ${t.model("Dog")} extends Pet {
      breed: string;
    }
  `);

  expect(
    <Wrapper>
      <ClassDeclaration type={Pet} jsonAttributes />
      <hbr />
      <ClassDeclaration type={Dog} jsonAttributes />
    </Wrapper>,
  ).toRenderTo(`
    using System.Text.Json.Serialization;

    class Pet
    {
        [JsonPropertyName("name")]
        public required string Name { get; set; }
    }
    class Dog : Pet
    {
        [JsonPropertyName("breed")]
        public required string Breed { get; set; }
    }
  `);
});

it("renders a model with nullable union property", async () => {
  const { Pet } = await runner.compile(t.code`
    model ${t.model("Pet")} {
      name: string | null;
    }
  `);

  expect(
    <Wrapper>
      <ClassDeclaration type={Pet} jsonAttributes />
    </Wrapper>,
  ).toRenderTo(`
    using System.Text.Json.Serialization;

    class Pet
    {
        [JsonPropertyName("name")]
        public required string? Name { get; set; }
    }
  `);
});

it("adds the JsonObject using for array properties of Record<unknown>", async () => {
  const { Page, StringMapPage } = await runner.compile(t.code`
    model DatasetRow is Record<unknown>;

    model ${t.model("Page")} {
      items: DatasetRow[];
    }

    model ${t.model("StringMapPage")} {
      items: Record<string>[];
    }
  `);

  const output = render(
    <Output program={runner.program} namePolicy={createCSharpNamePolicy()}>
      <EmitterOptions.Provider value={{ collectionType: "array", serviceNamespace: "Test" }}>
        <Models models={[Page, StringMapPage]} serviceNamespace={undefined} />
      </EmitterOptions.Provider>
    </Output>,
  );
  const pageFile = findFileContent(output, "Page.cs");
  const stringMapPageFile = findFileContent(output, "StringMapPage.cs");

  expect(pageFile).toBeDefined();
  expect(pageFile).toContain("using System.Text.Json.Nodes;");
  expect(pageFile).toContain("JsonObject[]");
  expect(stringMapPageFile).toBeDefined();
  expect(stringMapPageFile).not.toContain("using System.Text.Json.Nodes;");
  expect(stringMapPageFile).toContain("IDictionary<string, string>[]");
});

it("does not emit a model class for an @useAuth scheme model", async () => {
  await runner.compile(`
    @service
    @useAuth(MyKeyAuth)
    namespace Contoso;

    model MyKeyAuth is ApiKeyAuth<ApiKeyLocation.header, "x-api-key">;
    model Widget {
      id: string;
    }
  `);
  const tk = $(runner.program);
  const resolution = resolveServiceTypes(runner.program, tk, new HttpCanonicalizer(tk));

  // Auth scheme models are security metadata and must be excluded from the
  // emitted payload models (only the regular `Widget` model remains).
  expect(resolution.models.map((m) => m.name)).toEqual(["Widget"]);
  expect(
    <Wrapper>
      {resolution.models.map((m) => (
        <ClassDeclaration type={m} />
      ))}
    </Wrapper>,
  ).toRenderTo(`
    class Widget
    {
        public required string Id { get; set; }
    }
  `);
});
