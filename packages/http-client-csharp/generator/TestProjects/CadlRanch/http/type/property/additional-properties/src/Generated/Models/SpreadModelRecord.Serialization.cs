// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Property.AdditionalProperties
{
    public partial class SpreadModelRecord : IJsonModel<SpreadModelRecord>
    {
        void IJsonModel<SpreadModelRecord>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        SpreadModelRecord IJsonModel<SpreadModelRecord>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual SpreadModelRecord JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<SpreadModelRecord>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        SpreadModelRecord IPersistableModel<SpreadModelRecord>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual SpreadModelRecord PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<SpreadModelRecord>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(SpreadModelRecord spreadModelRecord) => throw null;

        public static explicit operator SpreadModelRecord(ClientResult result) => throw null;
    }
}
