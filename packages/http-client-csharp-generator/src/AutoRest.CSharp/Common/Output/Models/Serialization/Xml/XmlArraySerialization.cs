// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Output.Models.Serialization.Xml
{
    internal class XmlArraySerialization : XmlElementSerialization
    {
        public XmlArraySerialization(CSharpType type, XmlElementSerialization valueSerialization, string name, bool wrapped)
        {
            Type = type;
            ValueSerialization = valueSerialization;
            Name = name;
            Wrapped = wrapped;
        }

        public CSharpType Type { get; }
        public XmlElementSerialization ValueSerialization { get; }
        public override string Name { get; }
        public bool Wrapped { get; }
    }
}
