// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace UnbrandedTypeSpec.Models
{
    public partial class ProjectedModel : System.ClientModel.Primitives.IJsonModel<ProjectedModel>
    {
        // Add Constructors

        void System.ClientModel.Primitives.IJsonModel<ProjectedModel>.Write(System.Text.Json.Utf8JsonWriter writer, System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
        }

        ProjectedModel System.ClientModel.Primitives.IJsonModel<ProjectedModel>.Create(ref System.Text.Json.Utf8JsonReader reader, System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            return new ProjectedModel();
        }

        System.BinaryData System.ClientModel.Primitives.IPersistableModel<ProjectedModel>.Write(System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            return new System.BinaryData("IPersistableModel");
        }

        ProjectedModel System.ClientModel.Primitives.IPersistableModel<ProjectedModel>.Create(System.BinaryData data, System.ClientModel.Primitives.ModelReaderWriterOptions options)
        {
            return new ProjectedModel();
        }

        string System.ClientModel.Primitives.IPersistableModel<ProjectedModel>.GetFormatFromOptions(System.ClientModel.Primitives.ModelReaderWriterOptions options) => "J";

        // Add Nested Type
    }
}
