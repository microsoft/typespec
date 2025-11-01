import { useTsp } from "#core/index.js";
import { code, List, namekey, type Namekey, type Refkey } from "@alloy-js/core";
import type { Children } from "@alloy-js/core/jsx-runtime";
import { ClassDeclaration, Method } from "@alloy-js/csharp";
import System, { Xml } from "@alloy-js/csharp/global/System";
import Json, { Serialization } from "@alloy-js/csharp/global/System/Text/Json";
import { type Type } from "@typespec/compiler";
import { capitalize } from "@typespec/compiler/casing";
import { TypeExpression } from "../type-expression.jsx";

interface JsonConverterProps {
  name: string | Namekey;
  type: Type;
  refkey?: Refkey;
  /** Decode and return value from reader*/
  decodeAndReturn: (reader: Namekey, typeToConvert: Namekey, options: Namekey) => Children;
  /** Encode the given value and send to writer*/
  encodeAndWrite: (writer: Namekey, value: Namekey, options: Namekey) => Children;
}

/**
 * Generate a Json converter class inheriting System.Text.Json.Serialization.JsonConverter<T> which can be used by System.Text.Json.Serialization.JsonConverterAttribute to provide custom serialization.
 * @see https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/converters-how-to#steps-to-follow-the-basic-pattern
 */
export function JsonConverter(props: JsonConverterProps) {
  const readParamReader: Namekey = namekey("reader");
  const readParamTypeToConvert: Namekey = namekey("typeToConvert");
  const readParamOptions: Namekey = namekey("options");
  const writeParamWriter: Namekey = namekey("writer");
  const writeParamValue: Namekey = namekey("value");
  const writeParamOptions: Namekey = namekey("options");
  const propTypeExpression = code`${(<TypeExpression type={props.type} />)}`;
  return (
    <ClassDeclaration
      refkey={props.refkey}
      sealed
      internal
      name={props.name}
      baseType={code`${Serialization.JsonConverter}<${propTypeExpression}>`}
    >
      <List doubleHardline>
        <Method
          name={"Read"}
          public
          override
          parameters={[
            {
              name: readParamReader,
              ref: true,
              type: code`${Json.Utf8JsonReader}`,
            },
            { name: readParamTypeToConvert, type: code`${System.Type}` },
            {
              name: readParamOptions,
              type: code`${Json.JsonSerializerOptions}`,
            },
          ]}
          returns={propTypeExpression}
        >
          {code`${props.decodeAndReturn(readParamReader, readParamTypeToConvert, readParamOptions)}`}
        </Method>
        <Method
          name={"Write"}
          public
          override
          parameters={[
            { name: writeParamWriter, type: code`${Json.Utf8JsonWriter}` },
            {
              name: writeParamValue,
              type: propTypeExpression,
            },
            {
              name: writeParamOptions,
              type: code`${Json.JsonSerializerOptions}`,
            },
          ]}
        >
          {code`${props.encodeAndWrite(writeParamWriter, writeParamValue, writeParamOptions)}`}
        </Method>
      </List>
    </ClassDeclaration>
  );
}

export function TimeSpanSecondsJsonConverter(props: {
  name?: string | Namekey;
  refkey?: Refkey;
  encodeType: Type;
}) {
  const { $ } = useTsp();
  const map: Map<Type, { jsonWriteType: string; jsonReaderMethod: string }> = new Map([
    [$.builtin.int16, { jsonWriteType: "short", jsonReaderMethod: "GetInt16" }],
    [$.builtin.uint16, { jsonWriteType: "ushort", jsonReaderMethod: "GetUInt16" }],
    [$.builtin.int32, { jsonWriteType: "int", jsonReaderMethod: "GetInt32" }],
    [$.builtin.uint32, { jsonWriteType: "uint", jsonReaderMethod: "GetUInt32" }],
    [$.builtin.int64, { jsonWriteType: "long", jsonReaderMethod: "GetInt64" }],
    [$.builtin.uint64, { jsonWriteType: "ulong", jsonReaderMethod: "GetUInt64" }],
    [$.builtin.float32, { jsonWriteType: "float", jsonReaderMethod: "GetSingle" }],
    [$.builtin.float64, { jsonWriteType: "double", jsonReaderMethod: "GetDouble" }],
  ]);
  if (props.encodeType.kind !== "Scalar" || !map.has(props.encodeType)) {
    throw new Error(
      `TimeSpanSecondsJsonConverter only supports encodeType of int16, uint16, int32, uint32, int64, uint64, float32, or float64. Received: kind = ${props.encodeType.kind} ${props.encodeType.kind === "Scalar" ? `name = ${props.encodeType.name}` : ""}`,
    );
  }
  const found = map.get(props.encodeType)!;
  const capitalizedTypeName = capitalize(props.encodeType.name);
  const defaultName = `TimeSpanSeconds${capitalizedTypeName}JsonConverter`;

  return (
    <JsonConverter
      refkey={props.refkey}
      name={props.name ?? namekey(defaultName)}
      type={$.builtin.duration}
      decodeAndReturn={(reader) => {
        return code`var seconds = ${reader}.${found.jsonReaderMethod}();
                    return ${System.TimeSpan}.FromSeconds(seconds);`;
      }}
      encodeAndWrite={(writer, value) => {
        return code`${writer}.WriteNumberValue(${found.jsonWriteType === "double" || `(${found.jsonWriteType})`}${value}.TotalSeconds);`;
      }}
    />
  );
}

export function TimeSpanIso8601JsonConverter(props: { name?: string | Namekey; refkey?: Refkey }) {
  const { $ } = useTsp();
  return (
    <JsonConverter
      refkey={props.refkey}
      name={props.name ?? namekey("TimeSpanIso8601JsonConverter")}
      type={$.builtin.duration}
      decodeAndReturn={(reader) => {
        return code`var isoString = ${reader}.GetString();
                    if( isoString == null) 
                    {
                      throw new ${System.FormatException}("Invalid ISO8601 duration string: null");
                    }
                    return ${Xml.XmlConvert}.ToTimeSpan(isoString);`;
      }}
      encodeAndWrite={(writer, value) => {
        return code`${writer}.WriteStringValue(${Xml.XmlConvert}.ToString(${value}));`;
      }}
    />
  );
}
