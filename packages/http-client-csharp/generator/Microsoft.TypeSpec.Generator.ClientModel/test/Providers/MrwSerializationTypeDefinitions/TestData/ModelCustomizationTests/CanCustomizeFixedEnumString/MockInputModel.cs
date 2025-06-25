#nullable disable

using SampleTypeSpec;

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
