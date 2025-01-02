// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Type.Model.Visibility
{
    public partial class ReadOnlyModel : IJsonModel<ReadOnlyModel>
    {
        void IJsonModel<ReadOnlyModel>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        ReadOnlyModel IJsonModel<ReadOnlyModel>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual ReadOnlyModel JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<ReadOnlyModel>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        ReadOnlyModel IPersistableModel<ReadOnlyModel>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual ReadOnlyModel PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<ReadOnlyModel>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(ReadOnlyModel readOnlyModel) => throw null;

        public static explicit operator ReadOnlyModel(ClientResult result) => throw null;
    }
}
