// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Buffers;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecJsonConverter : JsonConverter<JsonElement>
    {
        private const int MaxExpandedBytes = 64 * 1024 * 1024;
        private readonly TypeSpecReferenceHandler.TypeSpecReferenceResolver _resolver;
        private readonly int _maxDepth;
        private readonly HashSet<string> _activeDictionaryReferences = new();

        public TypeSpecJsonConverter(TypeSpecReferenceHandler.TypeSpecReferenceResolver resolver, int maxDepth)
        {
            _resolver = resolver;
            _maxDepth = maxDepth;
        }

        public override JsonElement Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            using var document = JsonDocument.ParseValue(ref reader);
            return Decode(document.RootElement, preserveCycles: false, out _);
        }

        public override void Write(Utf8JsonWriter writer, JsonElement value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public JsonElement ResolveReference(JsonElement element)
        {
            if (element.ValueKind != JsonValueKind.Object || !element.TryGetProperty("$ref", out var reference))
            {
                return element;
            }
            var properties = element.EnumerateObject();
            properties.MoveNext();
            if (properties.MoveNext())
            {
                throw new JsonException("$ref should be the only property");
            }
            return _resolver.GetReferenceDefinition(ReadId(reference));
        }

        public JsonElement EnterDictionaryReference(JsonElement reference)
        {
            var definition = ResolveReference(reference);
            var id = ReadId(reference.GetProperty("$ref"));
            if (_activeDictionaryReferences.Count >= _maxDepth || !_activeDictionaryReferences.Add(id))
            {
                throw new JsonException($"Cannot resolve dictionary reference {id}: circular reference or maximum reference depth exceeded");
            }
            return definition;
        }

        public void ExitDictionaryReference(JsonElement reference)
            => _activeDictionaryReferences.Remove(ReadId(reference.GetProperty("$ref")));

        public JsonElement Decode(JsonElement element, bool preserveCycles, out bool referenceEncoded)
        {
            var buffer = new ArrayBufferWriter<byte>();
            using (var writer = new Utf8JsonWriter(buffer, new JsonWriterOptions { MaxDepth = _maxDepth }))
            {
                var remainingNodes = 1_000_000;
                referenceEncoded = !WriteDecoded(writer, element, new HashSet<string>(), 0, ref remainingNodes);
                if (writer.BytesCommitted + writer.BytesPending > MaxExpandedBytes)
                {
                    throw new JsonException("Raw JSON reference expansion exceeded the maximum depth or size");
                }
            }

            if (referenceEncoded)
            {
                if (!preserveCycles)
                {
                    throw new JsonException("A cyclic code-model reference cannot be expanded into plain JSON");
                }
                buffer.Clear();
                using var writer = new Utf8JsonWriter(buffer, new JsonWriterOptions { MaxDepth = _maxDepth + 4 });
                WriteGraph(writer, element);
            }

            using var document = JsonDocument.Parse(buffer.WrittenMemory, new JsonDocumentOptions { MaxDepth = _maxDepth + 4 });
            return document.RootElement.Clone();
        }

        private bool WriteDecoded(Utf8JsonWriter writer, JsonElement element, HashSet<string> active, int depth, ref int remainingNodes)
        {
            if (depth >= _maxDepth || --remainingNodes < 0 || writer.BytesCommitted + writer.BytesPending > MaxExpandedBytes)
            {
                throw new JsonException("Raw JSON reference expansion exceeded the maximum depth or size");
            }
            if (element.ValueKind == JsonValueKind.Object)
            {
                if (element.TryGetProperty("$ref", out _))
                {
                    return WriteDecoded(writer, ResolveReference(element), active, depth, ref remainingNodes);
                }
                var id = element.TryGetProperty("$id", out var identity) ? ReadId(identity) : null;
                if (id != null && !active.Add(id))
                {
                    return false;
                }
                writer.WriteStartObject();
                foreach (var property in element.EnumerateObject())
                {
                    if (property.NameEquals("$id"))
                    {
                        continue;
                    }
                    writer.WritePropertyName(_resolver.DecodePropertyName(property.Name));
                    if (!WriteDecoded(writer, property.Value, active, depth + 1, ref remainingNodes))
                    {
                        return false;
                    }
                }
                writer.WriteEndObject();
                if (id != null)
                {
                    active.Remove(id);
                }
            }
            else if (element.ValueKind == JsonValueKind.Array)
            {
                writer.WriteStartArray();
                foreach (var item in element.EnumerateArray())
                {
                    if (!WriteDecoded(writer, item, active, depth + 1, ref remainingNodes))
                    {
                        return false;
                    }
                }
                writer.WriteEndArray();
            }
            else
            {
                element.WriteTo(writer);
            }
            return true;
        }

        private static string ReadId(JsonElement element)
            => element.ValueKind == JsonValueKind.String ? element.GetString()! : throw new JsonException("Reference IDs must be strings");

        private void WriteGraph(Utf8JsonWriter writer, JsonElement root)
        {
            var pending = new Queue<string>();
            var included = new HashSet<string>();
            writer.WriteStartObject();
            writer.WriteString("format", "typespec-csharp-code-model");
            writer.WriteNumber("version", 2);
            writer.WritePropertyName("root");
            WriteEncoded(root);
            writer.WriteStartArray("definitions");
            while (pending.TryDequeue(out var id))
            {
                WriteEncoded(_resolver.GetReferenceDefinition(id), definition: true);
            }
            writer.WriteEndArray();
            writer.WriteEndObject();

            void WriteEncoded(JsonElement element, bool definition = false)
            {
                if (element.ValueKind == JsonValueKind.Object)
                {
                    if (!definition && (element.TryGetProperty("$id", out var id) || element.TryGetProperty("$ref", out id)))
                    {
                        var referenceId = ReadId(id);
                        if (included.Add(referenceId))
                        {
                            pending.Enqueue(referenceId);
                        }
                        writer.WriteStartObject();
                        writer.WriteString("$ref", referenceId);
                        writer.WriteEndObject();
                        return;
                    }
                    writer.WriteStartObject();
                    foreach (var property in element.EnumerateObject())
                    {
                        writer.WritePropertyName(property.Name);
                        WriteEncoded(property.Value);
                    }
                    writer.WriteEndObject();
                }
                else if (element.ValueKind == JsonValueKind.Array)
                {
                    writer.WriteStartArray();
                    foreach (var item in element.EnumerateArray())
                    {
                        WriteEncoded(item);
                    }
                    writer.WriteEndArray();
                }
                else
                {
                    element.WriteTo(writer);
                }
            }
        }
    }
}
