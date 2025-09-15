import { useTsp } from "#core/index.js";
import { code, List, refkey, type Refkey } from "@alloy-js/core";
import type { Children } from "@alloy-js/core/jsx-runtime";
import { ClassDeclaration, Method } from "@alloy-js/csharp";
import { type Type } from "@typespec/compiler";
import { TypeExpression } from "../type-expression.jsx";

interface JsonConverterProps {
  name: string;
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
      baseType={code`System.Text.Json.Serialization.JsonConverter<${propTypeExpression}>`}
    >
      <List doubleHardline>
        <Method
          name={"Read"}
          public
          override
          parameters={[
            {
              name: "reader",
              type: "ref System.Text.Json.Utf8JsonReader",
              refkey: readParamReader,
            },
            { name: "typeToConvert", type: "System.Type", refkey: readParamTypeToConvert },
            {
              name: "options",
              type: "System.Text.Json.JsonSerializerOptions",
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
            { name: "writer", type: "System.Text.Json.Utf8JsonWriter", refkey: writeParamWriter },
            {
              name: "value",
              type: propTypeExpression,
              refkey: writeParamValue,
            },
            {
              name: "options",
              type: "System.Text.Json.JsonSerializerOptions",
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

export function TimeSpanSecondsJsonConverter(props: { name: string; refkey?: Refkey }) {
  const { $ } = useTsp();
  return (
    <JsonConverter
      refkey={props.refkey}
      name={props.name}
      type={$.builtin.duration}
      decodeAndReturn={(reader) => {
        return code`int seconds = ${reader}.GetInt32();
                    return TimeSpan.FromSeconds(seconds);`;
      }}
      encodeAndWrite={(writer, value) => {
        return code`${writer}.WriteNumberValue((int)${value}.TotalSeconds);`;
      }}
    />
  );
}

export function TimeSpanIso8601JsonConverter(props: { name: string; refkey?: Refkey }) {
  const { $ } = useTsp();
  return (
    <JsonConverter
      refkey={props.refkey}
      name={props.name}
      type={$.builtin.duration}
      decodeAndReturn={(reader) => {
        return code`string isoString = ${reader}.GetString();
                    return XmlConvert.ToTimeSpan(isoString);`;
      }}
      encodeAndWrite={(writer, value) => {
        return code`${writer}.WriteStringValue(XmlConvert.ToString(${value}.value));`;
      }}
    />
  );
}
