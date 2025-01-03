// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Property.Nullable
{
    public partial class InnerModel : IJsonModel<InnerModel>
    {
        void IJsonModel<InnerModel>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        InnerModel IJsonModel<InnerModel>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual InnerModel JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<InnerModel>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        InnerModel IPersistableModel<InnerModel>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual InnerModel PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<InnerModel>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(InnerModel innerModel) => throw null;

        public static explicit operator InnerModel(ClientResult result) => throw null;
    }
}
