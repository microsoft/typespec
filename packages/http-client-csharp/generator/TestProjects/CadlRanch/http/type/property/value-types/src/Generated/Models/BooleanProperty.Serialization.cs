// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Property.ValueTypes.Models
{
    public partial class BooleanProperty : IJsonModel<BooleanProperty>
    {
        void IJsonModel<BooleanProperty>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        BooleanProperty IJsonModel<BooleanProperty>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual BooleanProperty JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<BooleanProperty>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        BooleanProperty IPersistableModel<BooleanProperty>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual BooleanProperty PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<BooleanProperty>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;
    }
}
