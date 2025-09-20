import { Tester } from "#test/test-host.js";
import { code, For, List, namekey, type Children } from "@alloy-js/core";
import { createCSharpNamePolicy, SourceFile } from "@alloy-js/csharp";
import { t, type TesterInstance } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, expect, it } from "vitest";
import { Output } from "../../../core/components/output.jsx";
import { Property } from "../property/property.jsx";
import {
  createJsonConverterResolver,
  JsonConverterResolver,
  useJsonConverterResolver,
  type JsonConverterResolverOptions,
} from "./json-converter-resolver.jsx";
import { JsonConverter } from "./json-converter.jsx";

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

function createTestJsonConverterResolver() {
  const option: JsonConverterResolverOptions = {
    customConverters: [
      {
        type: $(tester.program).builtin.string,
        encodeData: {
          type: $(tester.program).builtin.string,
          encoding: "fake-change",
        },
        info: {
          converter: FakeJsonConverter,
          nameKey: fakeJsonConverterKey,
        },
      },
    ],
  };
  return createJsonConverterResolver(option);
}

it("No resolved converters", async () => {
  await tester.compile(t.code``);
  expect(
    <Wrapper>
      <JsonConverterResolver.Provider value={createTestJsonConverterResolver()}>
        {code`Resolved JsonConverter: ${useJsonConverterResolver()?.listResolvedJsonConverters().length}`}
      </JsonConverterResolver.Provider>
    </Wrapper>,
  ).toRenderTo(`Resolved JsonConverter: 0`);
});

it("Resolve custom converter", async () => {
  const r = await tester.compile(t.code`
    model BaseModel {
      @encode("fake-change", string)
      ${t.modelProperty("prop1")}: string;
    }
  `);

  expect(
    <Wrapper>
      <JsonConverterResolver.Provider value={createTestJsonConverterResolver()}>
        <List>
          <Property type={r.prop1} jsonAttributes />
          <br />
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

    [JsonPropertyName("prop1")]
    [JsonConverter(typeof(FakeJsonConverter))]
    public required string Prop1 { get; set; }


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
