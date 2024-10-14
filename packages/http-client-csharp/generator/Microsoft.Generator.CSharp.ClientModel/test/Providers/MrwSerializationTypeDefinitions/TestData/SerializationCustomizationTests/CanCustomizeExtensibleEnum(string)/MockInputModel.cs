#nullable disable

using Microsoft.Generator.CSharp.Customization;
using Microsoft.Generator.CSharp.Primitives;

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
