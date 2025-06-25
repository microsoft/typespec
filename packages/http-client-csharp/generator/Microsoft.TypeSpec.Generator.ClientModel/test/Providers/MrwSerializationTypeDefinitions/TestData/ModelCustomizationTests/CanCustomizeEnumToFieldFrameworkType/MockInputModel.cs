#nullable disable

using SampleTypeSpec;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        [CodeGenMember("Prop1")]
        private object _prop1;
    }
}
