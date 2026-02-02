#nullable disable

using Sample;
using SampleTypeSpec;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public MockInputEnum Prop1 { get; } = MockInputEnum.Val1;
    }

    public enum MockInputEnum
    {
        Val1,
        Val2
    }
}
