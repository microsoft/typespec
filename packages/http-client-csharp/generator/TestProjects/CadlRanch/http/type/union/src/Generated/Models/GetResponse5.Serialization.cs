// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Type.Union
{
    public partial class GetResponse5 : IJsonModel<GetResponse5>
    {
        void IJsonModel<GetResponse5>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        GetResponse5 IJsonModel<GetResponse5>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual GetResponse5 JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<GetResponse5>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        GetResponse5 IPersistableModel<GetResponse5>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual GetResponse5 PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<GetResponse5>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(GetResponse5 getResponse5) => throw null;

        public static explicit operator GetResponse5(ClientResult result) => throw null;
    }
}
