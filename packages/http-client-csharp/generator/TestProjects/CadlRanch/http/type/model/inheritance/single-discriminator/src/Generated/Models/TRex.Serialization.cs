// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Model.Inheritance.SingleDiscriminator
{
    public partial class TRex : IJsonModel<TRex>
    {
        void IJsonModel<TRex>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected override void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        TRex IJsonModel<TRex>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected override Dinosaur JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<TRex>.Write(ModelReaderWriterOptions options) => throw null;

        protected override BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        TRex IPersistableModel<TRex>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected override Dinosaur PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<TRex>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(TRex tRex) => throw null;

        public static explicit operator TRex(ClientResult result) => throw null;
    }
}
