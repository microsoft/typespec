// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Type.Union
{
    public partial class GetResponse3 : IJsonModel<GetResponse3>
    {
        void IJsonModel<GetResponse3>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        GetResponse3 IJsonModel<GetResponse3>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual GetResponse3 JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<GetResponse3>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        GetResponse3 IPersistableModel<GetResponse3>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual GetResponse3 PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<GetResponse3>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(GetResponse3 getResponse3) => throw null;

        public static explicit operator GetResponse3(ClientResult result) => throw null;
    }
}
