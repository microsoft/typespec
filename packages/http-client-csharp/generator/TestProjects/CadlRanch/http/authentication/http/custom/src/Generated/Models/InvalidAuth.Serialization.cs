// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Authentication.Http.Custom.Models
{
    public partial class InvalidAuth : IJsonModel<InvalidAuth>
    {
        internal InvalidAuth() => throw null;

        void IJsonModel<InvalidAuth>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        InvalidAuth IJsonModel<InvalidAuth>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual InvalidAuth JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<InvalidAuth>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        InvalidAuth IPersistableModel<InvalidAuth>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual InvalidAuth PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<InvalidAuth>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(InvalidAuth invalidAuth) => throw null;

        public static explicit operator InvalidAuth(ClientResult result) => throw null;
    }
}
