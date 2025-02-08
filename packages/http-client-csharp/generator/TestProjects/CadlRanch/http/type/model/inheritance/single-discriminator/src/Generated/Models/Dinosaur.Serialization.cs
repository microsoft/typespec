// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Model.Inheritance.SingleDiscriminator
{
    [PersistableModelProxy(typeof(UnknownDinosaur))]
    public abstract partial class Dinosaur : IJsonModel<Dinosaur>
    {
        void IJsonModel<Dinosaur>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        Dinosaur IJsonModel<Dinosaur>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual Dinosaur JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<Dinosaur>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        Dinosaur IPersistableModel<Dinosaur>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual Dinosaur PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<Dinosaur>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(Dinosaur dinosaur) => throw null;

        public static explicit operator Dinosaur(ClientResult result) => throw null;
    }
}
