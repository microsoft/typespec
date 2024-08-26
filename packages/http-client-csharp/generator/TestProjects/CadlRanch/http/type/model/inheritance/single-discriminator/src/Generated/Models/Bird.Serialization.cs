// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Model.Inheritance.SingleDiscriminator.Models
{
    [PersistableModelProxy(typeof(UnknownBird))]
    public abstract partial class Bird : IJsonModel<Bird>
    {
        internal Bird() => throw null;

        void IJsonModel<Bird>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        Bird IJsonModel<Bird>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual Bird JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<Bird>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        Bird IPersistableModel<Bird>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual Bird PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<Bird>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(Bird bird) => throw null;

        public static explicit operator Bird(ClientResult result) => throw null;
    }
}
