#nullable disable

using Sample;
using SampleTypeSpec;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        // CUSTOM: Changed type from string.
        [CodeGenMember("Prop1")]
        public SomeEnum? Prop1 { get; }
    }

    public enum SomeEnum
    {
        Foo,
    }
}
