// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Model.Inheritance.SingleDiscriminator.Models
{
    public partial class Goose : IJsonModel<Goose>
    {
        void IJsonModel<Goose>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected override void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        Goose IJsonModel<Goose>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected override Bird JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<Goose>.Write(ModelReaderWriterOptions options) => throw null;

        protected override BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        Goose IPersistableModel<Goose>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected override Bird PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<Goose>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;
    }
}
