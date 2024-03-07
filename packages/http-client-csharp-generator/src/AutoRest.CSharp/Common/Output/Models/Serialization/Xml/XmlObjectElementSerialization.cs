// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Output.Models.Serialization.Xml
{
    internal record XmlObjectElementSerialization : XmlPropertySerialization
    {
        public XmlObjectElementSerialization(ObjectTypeProperty property, XmlElementSerialization valueSerialization)
            : base(property.Declaration.Name, property)
        {
            ValueSerialization = valueSerialization;
        }

        public XmlElementSerialization ValueSerialization { get; }
    }
}
