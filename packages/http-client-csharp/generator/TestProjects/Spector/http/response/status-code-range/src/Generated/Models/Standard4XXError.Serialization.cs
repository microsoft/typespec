// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Response.StatusCodeRange
{
    public partial class Standard4XXError : IJsonModel<Standard4XXError>
    {
        void IJsonModel<Standard4XXError>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        Standard4XXError IJsonModel<Standard4XXError>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual Standard4XXError JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<Standard4XXError>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        Standard4XXError IPersistableModel<Standard4XXError>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual Standard4XXError PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<Standard4XXError>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(Standard4XXError standard4XXError) => throw null;

        public static explicit operator Standard4XXError(ClientResult result) => throw null;
    }
}
