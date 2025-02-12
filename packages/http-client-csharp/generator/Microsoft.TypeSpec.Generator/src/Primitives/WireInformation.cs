// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    public class WireInformation
    {
        public SerializationFormat SerializationFormat { get; }
        public string SerializedName { get; internal set; }

        public WireInformation(SerializationFormat serializationFormat, string serializedName)
        {
            SerializationFormat = serializationFormat;
            SerializedName = serializedName;
        }
    }
}
