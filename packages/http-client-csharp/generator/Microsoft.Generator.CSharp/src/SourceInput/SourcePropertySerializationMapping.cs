// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.SourceInput
{
    internal sealed class SourcePropertySerializationMapping
    {
        public SourcePropertySerializationMapping(string propertyName, IReadOnlyList<string>? serializationPath, string? jsonSerializationValueHook, string? jsonDeserializationValueHook, string? bicepSerializationValueHook)
        {
            PropertyName = propertyName;
            SerializationPath = serializationPath;
            JsonSerializationValueHook = jsonSerializationValueHook;
            JsonDeserializationValueHook = jsonDeserializationValueHook;
            BicepSerializationValueHook = bicepSerializationValueHook;
        }

        internal string PropertyName { get; }
        internal IReadOnlyList<string>? SerializationPath { get; }
        internal string? JsonSerializationValueHook { get; }
        internal string? JsonDeserializationValueHook { get; }

        internal string? BicepSerializationValueHook { get; }
    }
}
