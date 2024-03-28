// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Output.Models.Serialization.Xml
{
    internal record XmlObjectAttributeSerialization : XmlPropertySerialization
    {
        public XmlObjectAttributeSerialization(string serializedName, ObjectTypeProperty property, XmlValueSerialization valueSerialization)
            : base(serializedName, property)
        {
            ValueSerialization = valueSerialization;
        }

        public XmlValueSerialization ValueSerialization { get; }
    }
}
