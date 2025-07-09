import { Tester } from "#test/test-host.js";
import { type Children } from "@alloy-js/core";
import { ClassDeclaration, createCSharpNamePolicy, Namespace, SourceFile } from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { Output } from "../../../core/components/output.jsx";
import { Property } from "./property.jsx";

let tester: TesterInstance;

beforeEach(async () => {
  tester = await Tester.createInstance();
});

function Wrapper(props: { children: Children }) {
  const policy = createCSharpNamePolicy();
  return (
    <Output program={tester.program} namePolicy={policy}>
      <Namespace name="TestNamespace">
        <SourceFile path="test.cs">
          <ClassDeclaration name="Test">{props.children}</ClassDeclaration>
        </SourceFile>
      </Namespace>
    </Output>
  );
}

it("maps prop: string | null to nullable property", async () => {
  const { prop1 } = await tester.compile(t.code`
    model TestModel {
      ${t.modelProperty("prop1")}: string | null;
    }
  `);

  expect(
    <Wrapper>
      <Property type={prop1} />
    </Wrapper>,
  ).toRenderTo(`
      namespace TestNamespace
      {
          class Test
          {
              public required string? Prop1 { get; set; }
          }
      }
  `);
});

describe("jsonAttributes", () => {
  it("adds [JsonNameAttribute]", async () => {
    const { prop1 } = await tester.compile(t.code`
    model TestModel {
      ${t.modelProperty("prop1")}: string;
    }
  `);

    expect(
      <Wrapper>
        <Property type={prop1} jsonAttributes />
      </Wrapper>,
    ).toRenderTo(`
      namespace TestNamespace
      {
          class Test
          {
              [System.Text.Json.JsonPropertyName("prop1")]
              public required string Prop1 { get; set; }
          }
      }
  `);
  });

  it("adds [JsonNameAttribute] respecting encodedName", async () => {
    const { prop1 } = await tester.compile(t.code`
    model TestModel {
      @encodedName("application/json", "prop_1")
      ${t.modelProperty("prop1")}: string;
    }
  `);

    expect(
      <Wrapper>
        <Property type={prop1} jsonAttributes />
      </Wrapper>,
    ).toRenderTo(`
      namespace TestNamespace
      {
          class Test
          {
              [System.Text.Json.JsonPropertyName("prop_1")]
              public required string Prop1 { get; set; }
          }
      }
  `);
  });
});
