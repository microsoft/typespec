// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;

namespace Type.Model.Inheritance.EnumDiscriminator
{
    public partial class Golden : Dog
    {
        public Golden(int weight) : base(DogKind.Golden, weight) => throw null;

        internal Golden(DogKind kind, int weight, IDictionary<string, BinaryData> additionalBinaryDataProperties) : base(kind, weight, additionalBinaryDataProperties) => throw null;
    }
}
