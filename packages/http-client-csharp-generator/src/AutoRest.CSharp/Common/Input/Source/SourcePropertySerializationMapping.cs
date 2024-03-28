// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace AutoRest.CSharp.Input.Source
{
    public class SourcePropertySerializationMapping
    {
        public SourcePropertySerializationMapping(string propertyName, IReadOnlyList<string>? serializationPath, string? jsonSerializationValueHook, string? jsonDeserializationValueHook, string? bicepSerializationValueHook)
        {
            PropertyName = propertyName;
            SerializationPath = serializationPath;
            JsonSerializationValueHook = jsonSerializationValueHook;
            JsonDeserializationValueHook = jsonDeserializationValueHook;
            BicepSerializationValueHook = bicepSerializationValueHook;
        }

        public string PropertyName { get; }
        public IReadOnlyList<string>? SerializationPath { get; }
        public string? JsonSerializationValueHook { get; }
        public string? JsonDeserializationValueHook { get; }

        public string? BicepSerializationValueHook { get; }
    }
}
