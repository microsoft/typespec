// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Property.AdditionalProperties
{
    public partial class SpreadStringRecord : IJsonModel<SpreadStringRecord>
    {
        void IJsonModel<SpreadStringRecord>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        SpreadStringRecord IJsonModel<SpreadStringRecord>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual SpreadStringRecord JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<SpreadStringRecord>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        SpreadStringRecord IPersistableModel<SpreadStringRecord>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual SpreadStringRecord PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<SpreadStringRecord>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(SpreadStringRecord spreadStringRecord) => throw null;

        public static explicit operator SpreadStringRecord(ClientResult result) => throw null;
    }
}
