// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;

namespace Type.Model.Inheritance.EnumDiscriminator
{
    internal partial class UnknownDog : Dog
    {
        internal UnknownDog(DogKind kind, int weight, IDictionary<string, BinaryData> additionalBinaryDataProperties) : base(kind != default ? kind : "unknown", weight, additionalBinaryDataProperties) => throw null;
    }
}
