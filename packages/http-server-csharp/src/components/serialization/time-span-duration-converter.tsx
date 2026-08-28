import { code, type Children } from "@alloy-js/core";
import { DocSummary, Namespace } from "@alloy-js/csharp";
import { JsonConverter } from "@typespec/emitter-framework/csharp";
import { CSharpFile } from "../csharp-file.jsx";

/**
 * Renders the TimeSpanDurationConverter JSON converter.
 * Converts between ISO 8601 duration strings and TimeSpan values.
 */
export function TimeSpanDurationConverter(): Children {
  return (
    <CSharpFile path="TimeSpanDurationConverter.cs" using={["System.Xml"]}>
      <Namespace name="TypeSpec.Helpers.JsonConverters">
        <JsonConverter
          name="TimeSpanDurationConverter"
          csharpType="TimeSpan"
          public
          sealed={false}
          doc={<DocSummary>Converts between Json duration and .Net TimeSpan</DocSummary>}
          decodeAndReturn={(reader, typeToConvert) => code`
            if (${typeToConvert} != typeof(TimeSpan))
              throw new ArgumentException($"Cannot apply converter {this.GetType().FullName} to type {${typeToConvert}.FullName}");

            var value = ${reader}.GetString();
            if (string.IsNullOrWhiteSpace(value))
              return TimeSpan.MinValue;
            return XmlConvert.ToTimeSpan(value);
          `}
          encodeAndWrite={(writer, value) => code`
            ${writer}.WriteStringValue(XmlConvert.ToString(${value}));
          `}
        />
      </Namespace>
    </CSharpFile>
  );
}
