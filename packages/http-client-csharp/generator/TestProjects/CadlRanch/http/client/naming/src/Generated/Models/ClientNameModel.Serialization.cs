// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Client.Naming.Models
{
    public partial class ClientNameModel : IJsonModel<ClientNameModel>
    {
        void IJsonModel<ClientNameModel>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        ClientNameModel IJsonModel<ClientNameModel>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual ClientNameModel JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<ClientNameModel>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        ClientNameModel IPersistableModel<ClientNameModel>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual ClientNameModel PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<ClientNameModel>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(ClientNameModel clientNameModel) => throw null;

        public static explicit operator ClientNameModel(ClientResult result) => throw null;
    }
}
