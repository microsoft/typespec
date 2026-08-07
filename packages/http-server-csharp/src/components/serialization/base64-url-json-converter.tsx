import { code, type Children } from "@alloy-js/core";
import { DocSummary, Namespace } from "@alloy-js/csharp";
import { JsonConverter } from "@typespec/emitter-framework/csharp";
import { CSharpFile } from "../csharp-file.jsx";

/**
 * Renders the Base64UrlJsonConverter.
 * Converts between base64url-encoded strings and byte arrays.
 */
export function Base64UrlJsonConverter(): Children {
  return (
    <CSharpFile path="Base64UrlJsonConverter.cs">
      <Namespace name="TypeSpec.Helpers.JsonConverters">
        <JsonConverter
          name="Base64UrlJsonConverter"
          csharpType="byte[]"
          public
          sealed={false}
          doc={
            <DocSummary>
              System.Text.Json converter for the properties using Base64Url encoding
            </DocSummary>
          }
          readReturns="byte[]?"
          decodeAndReturn={(reader, typeToConvert) => code`
            if (${typeToConvert} != typeof(byte[]))
              throw new ArgumentException($"Cannot apply converter {this.GetType().FullName} to type {${typeToConvert}.FullName}");
            var value = ${reader}.GetString();
            if (string.IsNullOrWhiteSpace(value))
              return null;
            return Convert.FromBase64String(Pad(value.Replace('-', '+').Replace('_', '/')));
          `}
          encodeAndWrite={(writer, value) => code`
            ${writer}.WriteStringValue(Convert.ToBase64String(${value}).TrimEnd('=').Replace('+', '-').Replace('/', '_'));
          `}
        >
          {code`
            /// <summary>
            /// Adds padding to the input
            /// </summary>
            /// <param name="input"> the input string </param>
            /// <returns> the padded string </returns>
            private static string Pad(string input)
            {
                var count = 3 - ((input.Length + 3) % 4);
                if (count == 0)
                {
                    return input;
                }
                return $"{input}{new string('=', count)}";
            }
          `}
        </JsonConverter>
      </Namespace>
    </CSharpFile>
  );
}
