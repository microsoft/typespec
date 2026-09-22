// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Buffers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Restores user property names inside raw JSON values. The emitter escapes data property names
    /// starting with <c>$</c> with an extra <c>$</c>, so that <c>$id</c> and <c>$ref</c> can only ever
    /// be serializer metadata.
    /// </summary>
    internal sealed class RawJsonConverter : JsonConverter<JsonElement>
    {
        public override JsonElement Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            using var document = JsonDocument.ParseValue(ref reader);
            using var decoded = JsonDocument.Parse(DecodePropertyNames(document.RootElement));
            return decoded.RootElement.Clone();
        }

        public override void Write(Utf8JsonWriter writer, JsonElement value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        /// <summary>
        /// Removes the escape prefix from every data property name in <paramref name="element"/>.
        /// </summary>
        public static string DecodePropertyNames(JsonElement element)
        {
            if (!HasEscapedPropertyName(element))
            {
                return element.GetRawText();
            }

            var buffer = new ArrayBufferWriter<byte>();
            using (var writer = new Utf8JsonWriter(buffer))
            {
                Write(writer, element);
            }
            return Encoding.UTF8.GetString(buffer.WrittenSpan);
        }

        private static bool HasEscapedPropertyName(JsonElement element)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    foreach (var property in element.EnumerateObject())
                    {
                        if (property.Name.StartsWith("$$", StringComparison.Ordinal) || HasEscapedPropertyName(property.Value))
                        {
                            return true;
                        }
                    }
                    return false;
                case JsonValueKind.Array:
                    foreach (var item in element.EnumerateArray())
                    {
                        if (HasEscapedPropertyName(item))
                        {
                            return true;
                        }
                    }
                    return false;
                default:
                    return false;
            }
        }

        /// <summary>
        /// Only a single leading <c>$</c> denotes serializer metadata, so an escaped data property
        /// name loses exactly one <c>$</c>.
        /// </summary>
        public static string DecodePropertyName(string name)
            => name.StartsWith("$$", StringComparison.Ordinal) ? name.Substring(1) : name;

        private static void Write(Utf8JsonWriter writer, JsonElement element)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    writer.WriteStartObject();
                    foreach (var property in element.EnumerateObject())
                    {
                        writer.WritePropertyName(DecodePropertyName(property.Name));
                        Write(writer, property.Value);
                    }
                    writer.WriteEndObject();
                    break;
                case JsonValueKind.Array:
                    writer.WriteStartArray();
                    foreach (var item in element.EnumerateArray())
                    {
                        Write(writer, item);
                    }
                    writer.WriteEndArray();
                    break;
                default:
                    element.WriteTo(writer);
                    break;
            }
        }
    }
}
