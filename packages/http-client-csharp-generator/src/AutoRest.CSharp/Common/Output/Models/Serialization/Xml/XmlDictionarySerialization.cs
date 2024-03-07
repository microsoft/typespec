// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Output.Models.Serialization.Xml
{
    internal class XmlDictionarySerialization : XmlElementSerialization
    {
        public XmlDictionarySerialization(CSharpType type, XmlElementSerialization valueSerialization, string name)
        {
            Type = type;
            ValueSerialization = valueSerialization;
            Name = name;
        }

        public override string Name { get; }
        public CSharpType Type { get; }
        public XmlElementSerialization ValueSerialization { get; }
    }
}
