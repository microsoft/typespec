// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Type.Property.AdditionalProperties
{
    public partial class ExtendsModelAdditionalProperties : IJsonModel<ExtendsModelAdditionalProperties>
    {
        void IJsonModel<ExtendsModelAdditionalProperties>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        ExtendsModelAdditionalProperties IJsonModel<ExtendsModelAdditionalProperties>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual ExtendsModelAdditionalProperties JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<ExtendsModelAdditionalProperties>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        ExtendsModelAdditionalProperties IPersistableModel<ExtendsModelAdditionalProperties>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual ExtendsModelAdditionalProperties PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<ExtendsModelAdditionalProperties>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(ExtendsModelAdditionalProperties extendsModelAdditionalProperties) => throw null;

        public static explicit operator ExtendsModelAdditionalProperties(ClientResult result) => throw null;
    }
}
