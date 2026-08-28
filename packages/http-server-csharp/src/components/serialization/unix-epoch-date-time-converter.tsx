import { code, type Children } from "@alloy-js/core";
import { DocSummary, Namespace } from "@alloy-js/csharp";
import { JsonConverter } from "@typespec/emitter-framework/csharp";
import { CSharpFile } from "../csharp-file.jsx";

/**
 * Renders the UnixEpochDateTimeConverter (DateTime) and UnixEpochDateTimeOffsetConverter (DateTimeOffset).
 * Converts between Unix epoch timestamps and DateTime/DateTimeOffset values.
 */
export function UnixEpochDateTimeConverter(): Children {
  return (
    <>
      <CSharpFile path="UnixEpochDateTimeConverter.cs">
        <Namespace name="TypeSpec.Helpers.JsonConverters">
          <JsonConverter
            name="UnixEpochDateTimeConverter"
            // `utcDateTime` maps to `DateTimeOffset`; this converter is the `DateTime` one.
            csharpType="DateTime"
            public
            doc={<DocSummary>Converts between an integer timestamp and a .Net DateTime</DocSummary>}
            decodeAndReturn={(reader) => code`
              var formatted = ${reader}.GetInt64()!;
              return s_epoch.AddMilliseconds(formatted);
            `}
            encodeAndWrite={(writer, value) => code`
              long unixTime = Convert.ToInt64((${value} - s_epoch).TotalMilliseconds);
              ${writer}.WriteNumberValue(unixTime);
            `}
          >
            {code`static readonly DateTime s_epoch = new DateTime(1970, 1, 1, 0, 0, 0);`}
          </JsonConverter>
        </Namespace>
      </CSharpFile>
      <CSharpFile path="UnixEpochDateTimeOffsetConverter.cs">
        <Namespace name="TypeSpec.Helpers.JsonConverters">
          <JsonConverter
            name="UnixEpochDateTimeOffsetConverter"
            // `DateTimeOffset` has no TypeSpec equivalent, so the C# type is given directly.
            csharpType="DateTimeOffset"
            public
            doc={
              <DocSummary>Converts between a Unix TimeStamp and a .Net DateTimeOffset</DocSummary>
            }
            decodeAndReturn={(reader) => code`
              var formatted = ${reader}.GetInt64()!;
              return s_epoch.AddMilliseconds(formatted);
            `}
            encodeAndWrite={(writer, value) => code`
              long unixTime = Convert.ToInt64((${value} - s_epoch).TotalMilliseconds);
              ${writer}.WriteNumberValue(unixTime);
            `}
          >
            {code`static readonly DateTimeOffset s_epoch = new DateTimeOffset(1970, 1, 1, 0, 0, 0, TimeSpan.Zero);`}
          </JsonConverter>
        </Namespace>
      </CSharpFile>
    </>
  );
}
