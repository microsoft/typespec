// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Model.Empty
{
    public partial class EmptyInputOutput : IJsonModel<EmptyInputOutput>
    {
        void IJsonModel<EmptyInputOutput>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        EmptyInputOutput IJsonModel<EmptyInputOutput>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual EmptyInputOutput JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<EmptyInputOutput>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        EmptyInputOutput IPersistableModel<EmptyInputOutput>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual EmptyInputOutput PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<EmptyInputOutput>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(EmptyInputOutput emptyInputOutput) => throw null;

        public static explicit operator EmptyInputOutput(ClientResult result) => throw null;
    }
}
