// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Union
{
    public partial class GetResponse2 : IJsonModel<GetResponse2>
    {
        void IJsonModel<GetResponse2>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        GetResponse2 IJsonModel<GetResponse2>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual GetResponse2 JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<GetResponse2>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        GetResponse2 IPersistableModel<GetResponse2>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual GetResponse2 PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<GetResponse2>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(GetResponse2 getResponse2) => throw null;

        public static explicit operator GetResponse2(ClientResult result) => throw null;
    }
}
