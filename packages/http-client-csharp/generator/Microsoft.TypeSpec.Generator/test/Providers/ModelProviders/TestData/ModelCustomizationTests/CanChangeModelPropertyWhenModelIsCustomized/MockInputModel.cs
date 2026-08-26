using System;
using System.Collections.Generic;
using SampleTypeSpec;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public Sample.Models.Custom.Foo Prop1 { get; };
    }
}

namespace Sample.Models.Custom
{
    public partial class Foo
    {
    }
}
