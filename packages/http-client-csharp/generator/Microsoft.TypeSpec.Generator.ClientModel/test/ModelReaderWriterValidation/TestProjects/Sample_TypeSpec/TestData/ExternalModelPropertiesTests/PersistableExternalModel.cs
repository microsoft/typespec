// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace ExternalModels
{
    public class PersistableExternalModel : IJsonModel<PersistableExternalModel>
    {
        private readonly Dictionary<string, JsonElement> _unknownProperties = [];

        public string? Name { get; private set; }

        PersistableExternalModel IJsonModel<PersistableExternalModel>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            ValidateFormat(options);
            using var document = JsonDocument.ParseValue(ref reader);
            var model = new PersistableExternalModel();
            foreach (var property in document.RootElement.EnumerateObject())
            {
                if (property.NameEquals("name"))
                {
                    model.Name = property.Value.GetString();
                }
                else if (options.Format != "W")
                {
                    model._unknownProperties.Add(property.Name, property.Value.Clone());
                }
            }
            return model;
        }

        void IJsonModel<PersistableExternalModel>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            ValidateFormat(options);
            writer.WriteStartObject();
            writer.WriteString("name", Name);
            if (options.Format != "W")
            {
                foreach (var property in _unknownProperties)
                {
                    writer.WritePropertyName(property.Key);
                    property.Value.WriteTo(writer);
                }
            }
            writer.WriteEndObject();
        }

        PersistableExternalModel IPersistableModel<PersistableExternalModel>.Create(BinaryData data, ModelReaderWriterOptions options)
        {
            var reader = new Utf8JsonReader(data.ToMemory().Span);
            reader.Read();
            return ((IJsonModel<PersistableExternalModel>)this).Create(ref reader, options)!;
        }

        BinaryData IPersistableModel<PersistableExternalModel>.Write(ModelReaderWriterOptions options)
        {
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                ((IJsonModel<PersistableExternalModel>)this).Write(writer, options);
            }
            return BinaryData.FromBytes(stream.ToArray());
        }

        string IPersistableModel<PersistableExternalModel>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        private static void ValidateFormat(ModelReaderWriterOptions options)
        {
            if (options.Format != "J" && options.Format != "W")
            {
                throw new FormatException($"Unsupported format '{options.Format}'.");
            }
        }
    }
}
