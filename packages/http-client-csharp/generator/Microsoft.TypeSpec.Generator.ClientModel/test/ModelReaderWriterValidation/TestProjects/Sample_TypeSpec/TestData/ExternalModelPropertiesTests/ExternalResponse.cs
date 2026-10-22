// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;

namespace ExternalModels
{
    public class ExternalResponse : IJsonModel<ExternalResponse>
    {
        protected ExternalResponse() : this(default, null!) { }

        protected ExternalResponse(ExternalResponseKind kind, string id)
        {
            Kind = kind;
            Id = id;
        }

        protected ExternalResponse(ExternalResponseKind kind, string id, IEnumerable<string> parentValue)
            : this(kind, id)
        {
        }

        public ExternalResponseKind Kind { get; }
        public string Id { get; }

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteString("type", Kind.ToString());
            writer.WriteString("id", Id);
        }

        protected virtual ExternalResponse JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            => throw new NotSupportedException();

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
            => throw new NotSupportedException();

        protected virtual ExternalResponse PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
            => throw new NotSupportedException();

        void IJsonModel<ExternalResponse>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }

        ExternalResponse IJsonModel<ExternalResponse>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            => JsonModelCreateCore(ref reader, options);

        BinaryData IPersistableModel<ExternalResponse>.Write(ModelReaderWriterOptions options)
            => PersistableModelWriteCore(options);

        ExternalResponse IPersistableModel<ExternalResponse>.Create(BinaryData data, ModelReaderWriterOptions options)
            => PersistableModelCreateCore(data, options);

        string IPersistableModel<ExternalResponse>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
    }

    public readonly struct ExternalResponseKind
    {
        private readonly string _value;

        public ExternalResponseKind(string value) => _value = value;

        public static implicit operator ExternalResponseKind(string value) => new(value);

        public override string ToString() => _value;
    }
}
