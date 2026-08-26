import { Tester } from "#test/tester.js";
import { type Children } from "@alloy-js/core";
import { createCSharpNamePolicy, SourceFile } from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { Output } from "@typespec/emitter-framework";
import { ClassDeclaration } from "@typespec/emitter-framework/csharp";
import { HttpCanonicalizer } from "@typespec/http-canonicalization";
import { beforeEach, expect, it } from "vitest";
import { resolveServiceTypes } from "../../service-resolution.js";

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
