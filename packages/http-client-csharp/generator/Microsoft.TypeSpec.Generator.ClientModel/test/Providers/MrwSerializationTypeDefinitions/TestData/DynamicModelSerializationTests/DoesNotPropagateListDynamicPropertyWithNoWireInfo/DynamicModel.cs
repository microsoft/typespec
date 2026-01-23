using SampleTypeSpec;
using System.Collections.Generic;

namespace Sample.Models
{
    public partial class DynamicModel
    {
        public IList<Foo> SomePropertyWithNoWireInfo { get; set; }
    }

    public partial class Foo
    {
    }
}
