import { Tester } from "#test/test-host.js";
import { List, type Children } from "@alloy-js/core";
import { ClassDeclaration, createCSharpNamePolicy, SourceFile } from "@alloy-js/csharp";
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
      <SourceFile path="test.cs">
        <ClassDeclaration name="Test">{props.children}</ClassDeclaration>
      </SourceFile>
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
      class Test
      {
          public required string? Prop1 { get; set; }
      }
  `);
});

it("maps optional properties to nullable properties", async () => {
  const { prop1 } = await tester.compile(t.code`
    model TestModel {
      ${t.modelProperty("prop1")}?: string;
    }
  `);

  expect(
    <Wrapper>
      <Property type={prop1} />
    </Wrapper>,
  ).toRenderTo(`
      class Test
      {
          public string? Prop1 { get; set; }
      }
  `);
});

it("maps optional and nullable properties to nullable properties", async () => {
  const { prop1 } = await tester.compile(t.code`
    model TestModel {
      ${t.modelProperty("prop1")}?: string | null;
    }
  `);

  expect(
    <Wrapper>
      <Property type={prop1} />
    </Wrapper>,
  ).toRenderTo(`
      class Test
      {
          public string? Prop1 { get; set; }
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
      class Test
      {
          [System.Text.Json.JsonPropertyName("prop1")]
          public required string Prop1 { get; set; }
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
        class Test
        {
            [System.Text.Json.JsonPropertyName("prop_1")]
            public required string Prop1 { get; set; }
        }
  `);
  });

  it("inherit prop: override, new", async () => {
    const r = await tester.compile(t.code`
      model TestModel extends BaseModel {
        ${t.modelProperty("prop1")}: string;
        ${t.modelProperty("prop2")}: string | null;
      }
      model BaseModel {
        prop1: string | null;
        prop2: string | null;
      }
    `);

    expect(
      <Wrapper>
        <List>
          <Property type={r.prop1} />
          <Property type={r.prop2} />
        </List>
      </Wrapper>,
    ).toRenderTo(`
      class Test
      {
          public new required string Prop1 { get; set; }
          public override required string? Prop2 { get; set; }
      }
    `);
  });

  it("inherit prop: virtual", async () => {
    const r = await tester.compile(t.code`
      model TestModel extends BaseModel {
        prop1: string;
        prop2: string | null;
      }
      model BaseModel {
        ${t.modelProperty("prop1")}: string | null;
        ${t.modelProperty("prop2")}: string | null;
      }
    `);

    expect(
      <Wrapper>
        <List>
          <Property type={r.prop1} />
          <Property type={r.prop2} />
        </List>
      </Wrapper>,
    ).toRenderTo(`
      class Test
      {
          public required string? Prop1 { get; set; }
          public virtual required string? Prop2 { get; set; }
      }
    `);
  });
});
