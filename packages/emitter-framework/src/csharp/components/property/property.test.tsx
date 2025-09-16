import { Tester } from "#test/test-host.js";
import { For, List, type Children } from "@alloy-js/core";
import { ClassDeclaration, createCSharpNamePolicy, SourceFile } from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { Output } from "../../../core/components/output.jsx";
import {
  createJsonConverterResolver,
  JsonConverterResolver,
  useJsonConverterResolver,
} from "../json-converter/json-converter-resolver.jsx";
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
      using System.Text.Json.Serialization;

      class Test
      {
          [JsonPropertyNameAttribute("prop1")]
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
            [System.Text.Json.Serialization.JsonPropertyName("prop_1")]
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

  it("json converter: duration -> seconds(int32)", async () => {
    const r = await tester.compile(t.code`
      model BaseModel {
        @encode(DurationKnownEncoding.seconds, int32)
        ${t.modelProperty("prop1")}?: duration;
        @encode(DurationKnownEncoding.seconds, float64)
        ${t.modelProperty("prop2")}: duration;
        @encode(DurationKnownEncoding.ISO8601, string)
        ${t.modelProperty("prop3")}: duration;
      }
    `);

    expect(
      <Wrapper>
        <JsonConverterResolver.Provider value={createJsonConverterResolver()}>
          <List>
            <Property type={r.prop1} jsonAttributes />
            <Property type={r.prop2} jsonAttributes />
            <Property type={r.prop3} jsonAttributes />
            <hbr />
            // JsonConverter wont work as nested class, but good enough for test to verify the
            generated code.
            <For each={useJsonConverterResolver()?.listResolvedJsonConverters() ?? []}>
              {(x) => <>{x.converter}</>}
            </For>
          </List>
        </JsonConverterResolver.Provider>
      </Wrapper>,
    ).toRenderTo(`
      using System;
      using System.Text.Json;
      using System.Text.Json.Serialization;
      using System.Xml;

      class Test
      {
          [JsonPropertyNameAttribute("prop1")]
          [JsonConverterAttribute(typeof(TimeSpanSecondsInt32JsonConverter))]
          public TimeSpan? Prop1 { get; set; }
          [JsonPropertyNameAttribute("prop2")]
          [JsonConverterAttribute(typeof(TimeSpanSecondsFloat64JsonConverter))]
          public required TimeSpan Prop2 { get; set; }
          [JsonPropertyNameAttribute("prop3")]
          [JsonConverterAttribute(typeof(TimeSpanIso8601JsonConverter))]
          public required TimeSpan Prop3 { get; set; }


          // JsonConverter wont work as nested class, but good enough for test to verify the generated code.
          internal sealed class TimeSpanSecondsInt32JsonConverter : JsonConverter<TimeSpan>
          {
              public override TimeSpan Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
              {
                  var seconds = reader.GetInt32();
                  return TimeSpan.FromSeconds(seconds);
              }

              public override void Write(Utf8JsonWriter writer, TimeSpan value, JsonSerializerOptions options)
              {
                  writer.WriteNumberValue((int)value.TotalSeconds);
              }
          }
          internal sealed class TimeSpanSecondsFloat64JsonConverter : JsonConverter<TimeSpan>
          {
              public override TimeSpan Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
              {
                  var seconds = reader.GetDouble();
                  return TimeSpan.FromSeconds(seconds);
              }

              public override void Write(Utf8JsonWriter writer, TimeSpan value, JsonSerializerOptions options)
              {
                  writer.WriteNumberValue(value.TotalSeconds);
              }
          }
          internal sealed class TimeSpanIso8601JsonConverter : JsonConverter<TimeSpan>
          {
              public override TimeSpan Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
              {
                  var isoString = reader.GetString();
                  if( isoString == null)
                  {
                      throw new FormatException("Invalid ISO8601 duration string: null");
                  }
                  return XmlConvert.ToTimeSpan(isoString);
              }

              public override void Write(Utf8JsonWriter writer, TimeSpan value, JsonSerializerOptions options)
              {
                  writer.WriteStringValue(XmlConvert.ToString(value));
              }
          }
      }
    `);
  });
});
