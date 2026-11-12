import { code, type Children } from "@alloy-js/core";
import { Namespace } from "@alloy-js/csharp";
import { CSharpFile } from "../csharp-file.jsx";

/**
 * Renders the Base64UrlJsonConverter.
 * Converts between base64url-encoded strings and byte arrays.
 */
export function Base64UrlJsonConverter(): Children {
  return (
    <CSharpFile
      path="Base64UrlJsonConverter.cs"
      using={["System.Text.Json", "System.Text.Json.Serialization"]}
    >
      <Namespace name="TypeSpec.Helpers.JsonConverters">
        {code`
          /// <summary>
          /// System.Text.Json converter for the properties using Base64Url encoding
          /// </summary>
          public class Base64UrlJsonConverter : JsonConverter<byte[]>
          {
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

            public override byte[]? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
              if (typeToConvert != typeof(byte[]))
                throw new ArgumentException($"Cannot apply converter {this.GetType().FullName} to type {typeToConvert.FullName}");
              var value = reader.GetString();
              if (string.IsNullOrWhiteSpace(value))
                return null;
              return Convert.FromBase64String(Pad(value.Replace('-', '+').Replace('_', '/')));
            }

            public override void Write(Utf8JsonWriter writer, byte[] value, JsonSerializerOptions options)
            {
              writer.WriteStringValue(Convert.ToBase64String(value).TrimEnd('=').Replace('+', '-').Replace('/', '_'));
            }
          }
        `}
      </Namespace>
    </CSharpFile>
  );
}
