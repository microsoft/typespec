// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


namespace AutoRest.CSharp.Output.Models.Serialization.Xml
{
    internal class XmlElementValueSerialization: XmlElementSerialization
    {
        public XmlElementValueSerialization(string name, XmlValueSerialization value)
        {
            Name = name;
            Value = value;
        }

        public override string Name { get; }
        public XmlValueSerialization Value { get; }
    }
}
