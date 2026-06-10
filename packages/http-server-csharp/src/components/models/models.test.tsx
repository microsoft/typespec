import { Tester } from "#test/tester.js";
import { type Children } from "@alloy-js/core";
import { createCSharpNamePolicy, SourceFile } from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { Output } from "@typespec/emitter-framework";
import { ClassDeclaration } from "@typespec/emitter-framework/csharp";
import { beforeEach, describe, expect, it } from "vitest";

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

describe("ClassDeclaration for models", () => {
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
});
