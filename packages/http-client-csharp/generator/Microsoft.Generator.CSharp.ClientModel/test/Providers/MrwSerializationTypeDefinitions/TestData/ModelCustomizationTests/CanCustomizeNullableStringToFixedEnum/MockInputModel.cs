#nullable disable

using Microsoft.Generator.CSharp.Customization;

namespace Sample.Models
{
    public enum MockInputEnum
    {
        One,
        Two,
        Three
    }

    public partial class MockInputModel
    {
        public MockInputEnum Prop1 { get; set; }
    }
}
