#nullable disable

using Sample;
using SampleTypeSpec;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public CustomEnum Prop1 { get; set; };
    }

    public enum CustomEnum
    {
        Foo,
        Bar
    }
}
