using SampleTypeSpec;

namespace Sample.Models
{
    public partial class DynamicModel
    {
        [CodeGenMember("Prop1")]
        public Foo Prop2 { get; set; }

        public Foo SomePropertyWithNoWireInfo { get; set; }
    }

    public partial class Foo
    {
    }
}
