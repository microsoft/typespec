// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Type.Property.ValueTypes
{
    public partial class UnknownArrayProperty : IJsonModel<UnknownArrayProperty>
    {
        void IJsonModel<UnknownArrayProperty>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        UnknownArrayProperty IJsonModel<UnknownArrayProperty>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual UnknownArrayProperty JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<UnknownArrayProperty>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        UnknownArrayProperty IPersistableModel<UnknownArrayProperty>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual UnknownArrayProperty PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<UnknownArrayProperty>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(UnknownArrayProperty unknownArrayProperty) => throw null;

        public static explicit operator UnknownArrayProperty(ClientResult result) => throw null;
    }
}
