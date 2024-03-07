// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Output.Models.Serialization.Xml
{
    internal class XmlValueSerialization
    {
        public XmlValueSerialization(CSharpType type, SerializationFormat format)
        {
            Type = type;
            Format = format;
        }
        public CSharpType Type { get; }
        public SerializationFormat Format { get; }
    }
}
