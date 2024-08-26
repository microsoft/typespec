// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Parameters.Basic.Models
{
    public partial class SimpleRequest : IJsonModel<SimpleRequest>
    {
        internal SimpleRequest() => throw null;

        void IJsonModel<SimpleRequest>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        SimpleRequest IJsonModel<SimpleRequest>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual SimpleRequest JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<SimpleRequest>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        SimpleRequest IPersistableModel<SimpleRequest>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual SimpleRequest PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<SimpleRequest>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(SimpleRequest simpleRequest) => throw null;

        public static explicit operator SimpleRequest(ClientResult result) => throw null;
    }
}
