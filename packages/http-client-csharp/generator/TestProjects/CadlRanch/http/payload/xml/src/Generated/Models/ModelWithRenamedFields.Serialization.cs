// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Payload.Xml.Models
{
    public partial class ModelWithRenamedFields : IJsonModel<ModelWithRenamedFields>
    {
        void IJsonModel<ModelWithRenamedFields>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        ModelWithRenamedFields IJsonModel<ModelWithRenamedFields>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual ModelWithRenamedFields JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<ModelWithRenamedFields>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        ModelWithRenamedFields IPersistableModel<ModelWithRenamedFields>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual ModelWithRenamedFields PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<ModelWithRenamedFields>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(ModelWithRenamedFields modelWithRenamedFields) => throw null;

        public static explicit operator ModelWithRenamedFields(ClientResult result) => throw null;
    }
}
