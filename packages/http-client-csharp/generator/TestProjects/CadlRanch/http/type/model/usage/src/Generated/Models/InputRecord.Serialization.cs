// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Model.Usage.Models
{
    public partial class InputRecord : IJsonModel<InputRecord>
    {
        void IJsonModel<InputRecord>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        InputRecord IJsonModel<InputRecord>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual InputRecord JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<InputRecord>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        InputRecord IPersistableModel<InputRecord>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual InputRecord PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<InputRecord>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;
    }
}
