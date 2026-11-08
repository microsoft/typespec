// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using ExternalModels;

namespace SampleTypeSpec
{
    public partial class ExternalModelProperties : IJsonModel<ExternalModelProperties>
    {
        private readonly IDictionary<string, BinaryData> _additionalBinaryDataProperties;

        public PersistableExternalModel? Scalar { get; }
        public IList<PersistableExternalModel?> List { get; }
        public IDictionary<string, PersistableExternalModel?> Dictionary { get; }

        internal ExternalModelProperties() : this(null, [], new Dictionary<string, PersistableExternalModel?>(), new Dictionary<string, BinaryData>())
        {
        }

        internal ExternalModelProperties(
            PersistableExternalModel? scalar,
            IList<PersistableExternalModel?> list,
            IDictionary<string, PersistableExternalModel?> dictionary,
            IDictionary<string, BinaryData> additionalBinaryDataProperties)
        {
            Scalar = scalar;
            List = list;
            Dictionary = dictionary;
            _additionalBinaryDataProperties = additionalBinaryDataProperties;
        }

        ExternalModelProperties? IJsonModel<ExternalModelProperties>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            ValidateFormat(options);
            using var document = JsonDocument.ParseValue(ref reader);
            return DeserializeExternalModelProperties(document.RootElement, options);
        }

        void IJsonModel<ExternalModelProperties>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            ValidateFormat(options);
            writer.WriteStartObject();
            writer.WritePropertyName("scalar");
            WriteExternalModel(writer, Scalar, options);
            writer.WritePropertyName("list");
            writer.WriteStartArray();
            foreach (var item in List)
            {
                WriteExternalModel(writer, item, options);
            }
            writer.WriteEndArray();
            writer.WritePropertyName("dictionary");
            writer.WriteStartObject();
            foreach (var item in Dictionary)
            {
                writer.WritePropertyName(item.Key);
                WriteExternalModel(writer, item.Value, options);
            }
            writer.WriteEndObject();
            if (options.Format != "W")
            {
                foreach (var item in _additionalBinaryDataProperties)
                {
                    writer.WritePropertyName(item.Key);
                    writer.WriteRawValue(item.Value);
                }
            }
            writer.WriteEndObject();
        }

        ExternalModelProperties? IPersistableModel<ExternalModelProperties>.Create(BinaryData data, ModelReaderWriterOptions options)
        {
            ValidateFormat(options);
            using var document = JsonDocument.Parse(data);
            return DeserializeExternalModelProperties(document.RootElement, options);
        }

        BinaryData IPersistableModel<ExternalModelProperties>.Write(ModelReaderWriterOptions options)
        {
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                ((IJsonModel<ExternalModelProperties>)this).Write(writer, options);
            }
            return BinaryData.FromBytes(stream.ToArray());
        }

        string IPersistableModel<ExternalModelProperties>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        private static void WriteExternalModel(Utf8JsonWriter writer, PersistableExternalModel? model, ModelReaderWriterOptions options)
        {
            if (model == null)
            {
                writer.WriteNullValue();
            }
            else
            {
                ((IJsonModel<PersistableExternalModel>)model).Write(writer, options);
            }
        }

        private static void ValidateFormat(ModelReaderWriterOptions options)
        {
            if (options.Format != "J" && options.Format != "W")
            {
                throw new FormatException($"Unsupported format '{options.Format}'.");
            }
        }
    }
}
