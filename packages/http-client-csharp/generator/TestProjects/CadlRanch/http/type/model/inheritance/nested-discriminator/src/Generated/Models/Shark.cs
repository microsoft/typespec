// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;

namespace _Type.Model.Inheritance.NestedDiscriminator.Models
{
    public partial class Shark : Fish
    {
        public Shark(string sharktype, int age) : base("shark", age) => throw null;

        internal Shark(string sharktype, string kind, int age, IDictionary<string, BinaryData> additionalBinaryDataProperties) : base(kind, age, additionalBinaryDataProperties) => throw null;

        internal string Sharktype
        {
            get => throw null;
            set => throw null;
        }
    }
}
