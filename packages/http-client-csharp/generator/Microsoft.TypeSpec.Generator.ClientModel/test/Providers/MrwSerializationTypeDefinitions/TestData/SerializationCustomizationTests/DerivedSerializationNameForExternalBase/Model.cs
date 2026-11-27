// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Text.Json;
using ExternalModels;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    [CodeGenSerialization(nameof(Id), SerializationName = "custom_id")]
    [CodeGenSerialization(nameof(Id), SerializationValueHook = nameof(WriteId))]
    public partial class Model : ExternalResponse
    {
        private void WriteId(Utf8JsonWriter writer, ModelReaderWriterOptions options) => writer.WriteStringValue(Id);
    }

    [CodeGenSerialization(nameof(Id), SerializationName = "leaf_id")]
    public partial class Leaf : Model
    {
    }
}
