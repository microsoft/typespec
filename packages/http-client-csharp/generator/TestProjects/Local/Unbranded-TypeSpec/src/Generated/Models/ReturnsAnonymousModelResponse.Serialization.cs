// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace UnbrandedTypeSpec
{
    public partial class ReturnsAnonymousModelResponse : System.ClientModel.Primitives.IJsonModel<ReturnsAnonymousModelResponse>
    {
        void System.ClientModel.Primitives.IJsonModel<ReturnsAnonymousModelResponse>.Write(System.Text.Json.Utf8JsonWriter writer, System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
        }

        ReturnsAnonymousModelResponse System.ClientModel.Primitives.IJsonModel<ReturnsAnonymousModelResponse>.Create(ref System.Text.Json.Utf8JsonReader reader, System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            return new ReturnsAnonymousModelResponse();
        }

        System.BinaryData System.ClientModel.Primitives.IPersistableModel<ReturnsAnonymousModelResponse>.Write(System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            return new System.BinaryData("IPersistableModel");
        }

        ReturnsAnonymousModelResponse System.ClientModel.Primitives.IPersistableModel<ReturnsAnonymousModelResponse>.Create(System.BinaryData data, System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            return new ReturnsAnonymousModelResponse();
        }

        string System.ClientModel.Primitives.IPersistableModel<ReturnsAnonymousModelResponse>.GetFormatFromOptions(System.ClientModel.Primitives.ModelReaderWriterOptions options) => "J";
    }
}
