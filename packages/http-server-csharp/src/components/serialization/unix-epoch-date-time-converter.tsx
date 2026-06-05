import { code, type Children } from "@alloy-js/core";
import { Namespace } from "@alloy-js/csharp";
import { CSharpFile } from "../csharp-file.jsx";

/**
 * Renders the UnixEpochDateTimeConverter (DateTime) and UnixEpochDateTimeOffsetConverter (DateTimeOffset).
 * Converts between Unix epoch timestamps and DateTime/DateTimeOffset values.
 */
export function UnixEpochDateTimeConverter(): Children {
  return (
    <>
      <CSharpFile
        path="UnixEpochDateTimeConverter.cs"
        using={["System.Text.Json", "System.Text.Json.Serialization"]}
      >
        <Namespace name="TypeSpec.Helpers.JsonConverters">
          {code`
            /// <summary>
            /// Converts between an integer timestamp and a .Net DateTime
            /// </summary>
            public sealed class UnixEpochDateTimeConverter : JsonConverter<DateTime>
            {
              static readonly DateTime s_epoch = new DateTime(1970, 1, 1, 0, 0, 0);

              public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
              {
                var formatted = reader.GetInt64()!;
                return s_epoch.AddMilliseconds(formatted);
              }

              public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
              {
                long unixTime = Convert.ToInt64((value - s_epoch).TotalMilliseconds);
                writer.WriteNumberValue(unixTime);
              }
            }
          `}
        </Namespace>
      </CSharpFile>
      <CSharpFile
        path="UnixEpochDateTimeOffsetConverter.cs"
        using={["System.Text.Json", "System.Text.Json.Serialization"]}
      >
        <Namespace name="TypeSpec.Helpers.JsonConverters">
          {code`
            /// <summary>
            /// Converts between a Unix TimeStamp and a .Net DateTimeOffset
            /// </summary>
            public sealed class UnixEpochDateTimeOffsetConverter : JsonConverter<DateTimeOffset>
            {
              static readonly DateTimeOffset s_epoch = new DateTimeOffset(1970, 1, 1, 0, 0, 0, TimeSpan.Zero);

              public override DateTimeOffset Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
              {
                var formatted = reader.GetInt64()!;
                return s_epoch.AddMilliseconds(formatted);
              }

              public override void Write(Utf8JsonWriter writer, DateTimeOffset value, JsonSerializerOptions options)
              {
                long unixTime = Convert.ToInt64((value - s_epoch).TotalMilliseconds);
                writer.WriteNumberValue(unixTime);
              }
            }
          `}
        </Namespace>
      </CSharpFile>
    </>
  );
}
