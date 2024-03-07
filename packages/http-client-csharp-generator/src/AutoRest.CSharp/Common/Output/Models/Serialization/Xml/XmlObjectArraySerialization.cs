// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Output.Models.Serialization.Xml
{
    internal record XmlObjectArraySerialization : XmlPropertySerialization
    {
        public XmlObjectArraySerialization(ObjectTypeProperty property, XmlArraySerialization arraySerialization)
            : base(property.Declaration.Name, property)
        {
            ArraySerialization = arraySerialization;
        }

        public XmlArraySerialization ArraySerialization { get; }
    }
}
