// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace _Type.Model.Inheritance.NestedDiscriminator
{
    public partial class SawShark : IJsonModel<SawShark>
    {
        void IJsonModel<SawShark>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        protected override void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) => throw null;

        SawShark IJsonModel<SawShark>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        protected override Fish JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => throw null;

        BinaryData IPersistableModel<SawShark>.Write(ModelReaderWriterOptions options) => throw null;

        protected override BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => throw null;

        SawShark IPersistableModel<SawShark>.Create(BinaryData data, ModelReaderWriterOptions options) => throw null;

        protected override Fish PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => throw null;

        string IPersistableModel<SawShark>.GetFormatFromOptions(ModelReaderWriterOptions options) => throw null;

        public static implicit operator BinaryContent(SawShark sawShark) => throw null;

        public static explicit operator SawShark(ClientResult result) => throw null;
    }
}
