// <auto-generated/>

#nullable disable

using System.Collections.Generic;

namespace _Type.Model.Inheritance.NestedDiscriminator.Models
{
    public static partial class TypeModelInheritanceNestedDiscriminatorModelFactory
    {
        public static Fish Fish(string kind = default, int age = default) => throw null;

        public static Shark Shark(int age = default) => throw null;

        public static SawShark SawShark(int age = default) => throw null;

        public static GoblinShark GoblinShark(int age = default) => throw null;

        public static Salmon Salmon(int age = default, IEnumerable<Fish> friends = default, IDictionary<string, Fish> hate = default, Fish partner = default) => throw null;
    }
}
