// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Union.Models
{
    public partial class EnumsOnlyCases : IJsonModel<EnumsOnlyCases>
    {
        internal EnumsOnlyCases() => throw null;

        void IJsonModel<EnumsOnlyCases>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        EnumsOnlyCases IJsonModel<EnumsOnlyCases>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected virtual EnumsOnlyCases JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<EnumsOnlyCases>.Write(ModelReaderWriterOptions options) => throw null;

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        EnumsOnlyCases IPersistableModel<EnumsOnlyCases>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected virtual EnumsOnlyCases PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<EnumsOnlyCases>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(EnumsOnlyCases enumsOnlyCases) => throw null;

        public static explicit operator EnumsOnlyCases(ClientResult result) => throw null;
    }
}
