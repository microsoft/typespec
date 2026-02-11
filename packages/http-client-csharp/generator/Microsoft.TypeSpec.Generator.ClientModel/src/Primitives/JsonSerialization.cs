// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;

namespace Microsoft.TypeSpec.Generator.ClientModel.Primitives
{
    /// <summary>
    /// Represents JSON serialization options for a property or model.
    /// </summary>
    public class JsonSerialization
    {
        public JsonSerialization(InputJsonSerializationOptions options)
        {
            Name = options.Name;
        }

        /// <summary>
        /// Gets or sets the serialized name for JSON format.
        /// </summary>
        public string Name { get; internal set; }
    }
}
