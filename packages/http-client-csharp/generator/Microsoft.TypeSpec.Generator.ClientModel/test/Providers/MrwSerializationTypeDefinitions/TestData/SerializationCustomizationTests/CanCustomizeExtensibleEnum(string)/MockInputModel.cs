#nullable disable

using SampleTypeSpec;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public EnumType Prop1 { get; set; }
    }

    public readonly partial struct EnumType
    {
        public static EnumType Foo = new EnumType("Foo");
    }
}
