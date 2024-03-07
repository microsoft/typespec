// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Output.Models.Serialization.Xml
{
    internal abstract class XmlElementSerialization: ObjectSerialization
    {
        public abstract string Name { get; }
    }
}
