// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Property.AdditionalProperties.Models
{
    public partial class ModelForRecord : IJsonModel<ModelForRecord>
    {
        void IJsonModel<ModelForRecord>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        ModelForRecord IJsonModel<ModelForRecord>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual ModelForRecord JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<ModelForRecord>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        ModelForRecord IPersistableModel<ModelForRecord>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual ModelForRecord PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<ModelForRecord>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(ModelForRecord modelForRecord) => throw null;

        public static explicit operator ModelForRecord(ClientResult result) => throw null;
    }
}
