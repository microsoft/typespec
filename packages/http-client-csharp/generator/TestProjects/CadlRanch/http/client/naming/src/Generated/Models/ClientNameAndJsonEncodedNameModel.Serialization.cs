// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Client.Naming.Models
{
    public partial class ClientNameAndJsonEncodedNameModel : IJsonModel<ClientNameAndJsonEncodedNameModel>
    {
        void IJsonModel<ClientNameAndJsonEncodedNameModel>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        ClientNameAndJsonEncodedNameModel IJsonModel<ClientNameAndJsonEncodedNameModel>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual ClientNameAndJsonEncodedNameModel JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<ClientNameAndJsonEncodedNameModel>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        ClientNameAndJsonEncodedNameModel IPersistableModel<ClientNameAndJsonEncodedNameModel>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual ClientNameAndJsonEncodedNameModel PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<ClientNameAndJsonEncodedNameModel>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(ClientNameAndJsonEncodedNameModel clientNameAndJsonEncodedNameModel) => throw null;

        public static explicit operator ClientNameAndJsonEncodedNameModel(ClientResult result) => throw null;
    }
}
