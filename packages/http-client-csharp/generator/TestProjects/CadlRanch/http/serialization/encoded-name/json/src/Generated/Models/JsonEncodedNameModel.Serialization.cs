// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Serialization.EncodedName.Json._Property
{
    public partial class JsonEncodedNameModel : IJsonModel<JsonEncodedNameModel>
    {
        void IJsonModel<JsonEncodedNameModel>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        JsonEncodedNameModel IJsonModel<JsonEncodedNameModel>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual JsonEncodedNameModel JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<JsonEncodedNameModel>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        JsonEncodedNameModel IPersistableModel<JsonEncodedNameModel>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual JsonEncodedNameModel PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<JsonEncodedNameModel>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(JsonEncodedNameModel jsonEncodedNameModel) => throw null;

        public static explicit operator JsonEncodedNameModel(ClientResult result) => throw null;
    }
}
