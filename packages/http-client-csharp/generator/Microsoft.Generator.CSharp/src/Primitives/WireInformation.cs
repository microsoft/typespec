// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp.Primitives
{
    public class WireInformation
    {
        public SerializationFormat SerializationFormat { get; }
        public string SerializedName { get; }

        public WireInformation(SerializationFormat serializationFormat, string serializedName)
        {
            SerializationFormat = serializationFormat;
            SerializedName = serializedName;
        }
    }
}
