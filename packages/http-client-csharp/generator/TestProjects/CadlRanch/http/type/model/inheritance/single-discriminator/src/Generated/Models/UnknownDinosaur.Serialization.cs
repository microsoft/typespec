// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Model.Inheritance.SingleDiscriminator
{
    internal partial class UnknownDinosaur : IJsonModel<Dinosaur>
    {
        void IJsonModel<Dinosaur>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected override void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        Dinosaur IJsonModel<Dinosaur>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected override Dinosaur JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<Dinosaur>.Write(ModelReaderWriterOptions options) => throw null;

        protected override BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        Dinosaur IPersistableModel<Dinosaur>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected override Dinosaur PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<Dinosaur>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;
    }
}
