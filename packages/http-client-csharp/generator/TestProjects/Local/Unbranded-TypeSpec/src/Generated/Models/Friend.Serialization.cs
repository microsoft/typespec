// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace UnbrandedTypeSpec.Models
{
    public partial class Friend : System.ClientModel.Primitives.IJsonModel<Friend>
    {
        // Add Constructors

        void System.ClientModel.Primitives.IJsonModel<Friend>.Write(System.Text.Json.Utf8JsonWriter writer, System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
        }

        Friend System.ClientModel.Primitives.IJsonModel<Friend>.Create(ref System.Text.Json.Utf8JsonReader reader, System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            return new Friend();
        }

        System.BinaryData System.ClientModel.Primitives.IPersistableModel<Friend>.Write(System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            return new System.BinaryData("IPersistableModel");
        }

        Friend System.ClientModel.Primitives.IPersistableModel<Friend>.Create(System.BinaryData data, System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            return new Friend();
        }

        string System.ClientModel.Primitives.IPersistableModel<Friend>.GetFormatFromOptions(System.ClientModel.Primitives.ModelReaderWriterOptions options) => "J";

        // Add Nested Type
    }
}
