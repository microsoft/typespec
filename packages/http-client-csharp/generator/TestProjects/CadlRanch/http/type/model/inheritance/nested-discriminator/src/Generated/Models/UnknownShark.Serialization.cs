// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Type.Model.Inheritance.NestedDiscriminator
{
    internal partial class UnknownShark : IJsonModel<Shark>
    {
        void IJsonModel<Shark>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected override void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        Shark IJsonModel<Shark>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected override Fish JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<Shark>.Write(ModelReaderWriterOptions options) => throw null;

        protected override BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        Shark IPersistableModel<Shark>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected override Fish PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<Shark>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;
    }
}
