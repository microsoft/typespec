// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Type.Model.Inheritance.EnumDiscriminator
{
    internal partial class UnknownDog : IJsonModel<Dog>
    {
        void IJsonModel<Dog>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected override void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        Dog IJsonModel<Dog>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected override Dog JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<Dog>.Write(ModelReaderWriterOptions options) => throw null;

        protected override BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        Dog IPersistableModel<Dog>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected override Dog PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<Dog>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;
    }
}
