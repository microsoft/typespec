import { code, type Children } from "@alloy-js/core";
import { Namespace } from "@alloy-js/csharp";
import { CSharpFile } from "../csharp-file.jsx";

/**
 * Renders the TimeSpanDurationConverter JSON converter.
 * Converts between ISO 8601 duration strings and TimeSpan values.
 */
export function TimeSpanDurationConverter(): Children {
  return (
    <CSharpFile
      path="TimeSpanDurationConverter.cs"
      using={["System.Text.Json", "System.Text.Json.Serialization", "System.Xml"]}
    >
      <Namespace name="TypeSpec.Helpers.JsonConverters">
        {code`
          /// <summary>
          /// Converts between Json duration and .Net TimeSpan
          /// </summary>
          public class TimeSpanDurationConverter : JsonConverter<TimeSpan>
          {
            public override TimeSpan Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
              if (typeToConvert != typeof(TimeSpan))
                throw new ArgumentException($"Cannot apply converter {this.GetType().FullName} to type {typeToConvert.FullName}");

              var value = reader.GetString();
              if (string.IsNullOrWhiteSpace(value))
                return TimeSpan.MinValue;
              return XmlConvert.ToTimeSpan(value);
            }

            public override void Write(Utf8JsonWriter writer, TimeSpan value, JsonSerializerOptions options)
            {
              writer.WriteStringValue(XmlConvert.ToString(value));
            }
          }
        `}
      </Namespace>
    </CSharpFile>
  );
}
