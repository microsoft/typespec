import { useTsp } from "#core/index.js";
import { code, List, namekey, refkey, type Namekey, type Refkey } from "@alloy-js/core";
import type { Children } from "@alloy-js/core/jsx-runtime";
import { ClassDeclaration, Method } from "@alloy-js/csharp";
import System, { Xml } from "@alloy-js/csharp/global/System/index.js";
import Json, { Serialization } from "@alloy-js/csharp/global/System/Text/Json/index.js";
import { type Type } from "@typespec/compiler";
import { TypeExpression } from "../type-expression.jsx";

interface JsonConverterProps {
  name: string | Namekey;
  type: Type;
  refkey?: Refkey;
  /** Decode and return value from reader*/
  decodeAndReturn: (reader: Refkey, typeToConvert: Refkey, options: Refkey) => Children;
  /** Encode the given value and send to writer*/
  encodeAndWrite: (writer: Refkey, value: Refkey, options: Refkey) => Children;
}

export function JsonConverter(props: JsonConverterProps) {
  const readParamReader: Refkey = refkey();
  const readParamTypeToConvert: Refkey = refkey();
  const readParamOptions: Refkey = refkey();
  const writeParamWriter: Refkey = refkey();
  const writeParamValue: Refkey = refkey();
  const writeParamOptions: Refkey = refkey();
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
              name: "reader",
              type: code`ref ${Json.Utf8JsonReader}`,
              refkey: readParamReader,
            },
            { name: "typeToConvert", type: code`${System.Type}`, refkey: readParamTypeToConvert },
            {
              name: "options",
              type: code`${Json.JsonSerializerOptions}`,
              refkey: readParamOptions,
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
            { name: "writer", type: code`${Json.Utf8JsonWriter}`, refkey: writeParamWriter },
            {
              name: "value",
              type: propTypeExpression,
              refkey: writeParamValue,
            },
            {
              name: "options",
              type: code`${Json.JsonSerializerOptions}`,
              refkey: writeParamOptions,
            },
          ]}
        >
          {code`${props.encodeAndWrite(writeParamWriter, writeParamValue, writeParamOptions)}`}
        </Method>
      </List>
    </ClassDeclaration>
  );
}

export function TimeSpanSecondsJsonConverter(props: { name?: string | Namekey; refkey?: Refkey }) {
  const { $ } = useTsp();
  return (
    <JsonConverter
      refkey={props.refkey}
      name={props.name ?? namekey("TimeSpanSecondsJsonConverter")}
      type={$.builtin.duration}
      decodeAndReturn={(reader) => {
        return code`int seconds = ${reader}.GetInt32();
                    return ${System.TimeSpan}.FromSeconds(seconds);`;
      }}
      encodeAndWrite={(writer, value) => {
        return code`${writer}.WriteNumberValue((int)${value}.TotalSeconds);`;
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
        return code`string isoString = ${reader}.GetString();
                    return ${Xml.XmlConvert}.ToTimeSpan(isoString);`;
      }}
      encodeAndWrite={(writer, value) => {
        return code`${writer}.WriteStringValue(${Xml.XmlConvert}.ToString(${value}.value));`;
      }}
    />
  );
}
