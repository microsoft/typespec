using SampleTypeSpec;

namespace Sample.Models
{
    public partial class DynamicModel
    {
        public Foo SomePropertyWithNoWireInfo { get; set; }
    }

    public partial class Foo
    {
    }
}
