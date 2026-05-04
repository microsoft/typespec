import { Tester } from "#test/test-host.js";
import { code, namekey, type Children } from "@alloy-js/core";
import { createCSharpNamePolicy, SourceFile } from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, describe, expect, it } from "vitest";
import { Output } from "../../../core/components/output.jsx";
import {
  JsonConverter,
  TimeSpanIso8601JsonConverter,
  TimeSpanSecondsJsonConverter,
} from "./json-converter.jsx";

let tester: TesterInstance;

beforeEach(async () => {
  tester = await Tester.createInstance();
});

function Wrapper(props: { children: Children }) {
  const policy = createCSharpNamePolicy();
  return (
    <Output program={tester.program} namePolicy={policy}>
      <SourceFile path="test.cs">{props.children}</SourceFile>
    </Output>
  );
}

const fakeJsonConverterKey = namekey("FakeJsonConverter");
function FakeJsonConverter() {
  return (
    <JsonConverter
      name={fakeJsonConverterKey}
      type={$(tester.program).builtin.string}
      decodeAndReturn={(reader) => {
        return code`return ${reader}.GetString();`;
      }}
      encodeAndWrite={(writer, value) => {
        return code`${writer}.WriteStringValue(${value});`;
      }}
    />
  );
}

it("Custom JsonConverter", async () => {
  await tester.compile(t.code``);
  expect(
    <Wrapper>
      <FakeJsonConverter />
    </Wrapper>,
  ).toRenderTo(`
    using System;
    using System.Text.Json;
    using System.Text.Json.Serialization;

    internal sealed class FakeJsonConverter : JsonConverter<string>
    {
        public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.GetString();
        }

        public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value);
        }
    }`);
});

describe("Known JsonConverters", () => {
  it("TimeSpanIso8601JsonConverter", async () => {
    await tester.compile(t.code``);
    expect(
      <Wrapper>
        <TimeSpanIso8601JsonConverter />
      </Wrapper>,
    ).toRenderTo(`
      using System;
      using System.Text.Json;
      using System.Text.Json.Serialization;
      using System.Xml;

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
  `);
  });

  describe.each([
    ["int16", "(short)", "GetInt16"],
    ["uint16", "(ushort)", "GetUInt16"],
    ["int32", "(int)", "GetInt32"],
    ["uint32", "(uint)", "GetUInt32"],
    ["int64", "(long)", "GetInt64"],
    ["uint64", "(ulong)", "GetUInt64"],
    ["float32", "(float)", "GetSingle"],
    ["float64", "", "GetDouble"],
  ] as const)("%s", (typeName, jsonWriteType, jsonReaderMethod) => {
    it("TimeSpanSecondsJsonConverter", async () => {
      await tester.compile(t.code``);
      const type = $(tester.program).builtin[typeName];
      expect(
        <Wrapper>
          <TimeSpanSecondsJsonConverter encodeType={type} />
        </Wrapper>,
      ).toRenderTo(`
      using System;
      using System.Text.Json;
      using System.Text.Json.Serialization;

      internal sealed class TimeSpanSeconds${typeName.charAt(0).toUpperCase() + typeName.slice(1)}JsonConverter : JsonConverter<TimeSpan>
      {
          public override TimeSpan Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
          {
              var seconds = reader.${jsonReaderMethod}();
              return TimeSpan.FromSeconds(seconds);
          }

          public override void Write(Utf8JsonWriter writer, TimeSpan value, JsonSerializerOptions options)
          {
              writer.WriteNumberValue(${jsonWriteType}value.TotalSeconds);
          }
      }
  `);
    });
  });
});
