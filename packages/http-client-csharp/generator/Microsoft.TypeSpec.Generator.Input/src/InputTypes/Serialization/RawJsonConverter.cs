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
    /// be serializer metadata. This converter is only registered for documents that use that escaping.
    /// </summary>
    internal sealed class RawJsonConverter : JsonConverter<JsonElement>
    {
        private readonly TypeSpecReferenceHandler.TypeSpecReferenceResolver _resolver;

        public RawJsonConverter(TypeSpecReferenceHandler.TypeSpecReferenceResolver resolver)
        {
            _resolver = resolver;
        }

        public override JsonElement Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            using var document = JsonDocument.ParseValue(ref reader);
            using var decoded = JsonDocument.Parse(DecodePropertyNames(document.RootElement, _resolver));
            return decoded.RootElement.Clone();
        }

        public override void Write(Utf8JsonWriter writer, JsonElement value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static string DecodePropertyNames(JsonElement element, TypeSpecReferenceHandler.TypeSpecReferenceResolver? resolver)
        {
            if (resolver?.UsesEscapedPropertyNames != true)
            {
                return element.GetRawText();
            }

            var buffer = new ArrayBufferWriter<byte>();
            using (var writer = new Utf8JsonWriter(buffer))
            {
                Write(writer, element, resolver);
            }
            return Encoding.UTF8.GetString(buffer.WrittenSpan);
        }

        private static void Write(Utf8JsonWriter writer, JsonElement element, TypeSpecReferenceHandler.TypeSpecReferenceResolver resolver)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    writer.WriteStartObject();
                    foreach (var property in element.EnumerateObject())
                    {
                        writer.WritePropertyName(resolver.DecodePropertyName(property.Name));
                        Write(writer, property.Value, resolver);
                    }
                    writer.WriteEndObject();
                    break;
                case JsonValueKind.Array:
                    writer.WriteStartArray();
                    foreach (var item in element.EnumerateArray())
                    {
                        Write(writer, item, resolver);
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
