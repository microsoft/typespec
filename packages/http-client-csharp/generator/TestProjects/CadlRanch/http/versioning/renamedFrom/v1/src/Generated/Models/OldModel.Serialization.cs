// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Versioning.RenamedFrom
{
    public partial class OldModel : IJsonModel<OldModel>
    {
        void IJsonModel<OldModel>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        OldModel IJsonModel<OldModel>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual OldModel JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<OldModel>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        OldModel IPersistableModel<OldModel>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual OldModel PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<OldModel>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(OldModel oldModel) => throw null;

        public static explicit operator OldModel(ClientResult result) => throw null;
    }
}
