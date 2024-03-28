// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Output.Models.Serialization
{
    internal struct CustomSerializationHooks
    {
        public CustomSerializationHooks(string? jsonSerializationMethodName, string? jsonDeserializationMethodName, string? bicepSerializationMethodName)
        {
            JsonSerializationMethodName = jsonSerializationMethodName;
            JsonDeserializationMethodName = jsonDeserializationMethodName;
            BicepSerializationMethodName = bicepSerializationMethodName;
        }

        public string? BicepSerializationMethodName { get; }

        public string? JsonDeserializationMethodName { get; }

        public string? JsonSerializationMethodName { get; }
    }
}
