// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Model.Inheritance.EnumDiscriminator.Models
{
    public partial class Cobra : IJsonModel<Cobra>
    {
        void IJsonModel<Cobra>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected override void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        Cobra IJsonModel<Cobra>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected override Snake JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<Cobra>.Write(ModelReaderWriterOptions options) => throw null;

        protected override BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        Cobra IPersistableModel<Cobra>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected override Snake PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<Cobra>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;
    }
}
