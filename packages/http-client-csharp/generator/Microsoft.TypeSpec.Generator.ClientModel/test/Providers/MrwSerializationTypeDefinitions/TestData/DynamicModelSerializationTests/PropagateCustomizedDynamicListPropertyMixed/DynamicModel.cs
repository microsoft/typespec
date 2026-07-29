using SampleTypeSpec;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class DynamicModel
    {
        [CodeGenMember("Prop1")]
        public IList<Foo> Prop2 { get; set; }

        public IList<Foo> SomePropertyWithNoWireInfo { get; set; }
    }

    public partial class Foo
    {
    }
}
