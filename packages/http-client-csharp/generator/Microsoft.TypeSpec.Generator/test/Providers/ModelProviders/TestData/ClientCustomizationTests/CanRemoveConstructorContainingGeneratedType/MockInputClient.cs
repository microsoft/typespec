using System.Collections.Generic;
using SampleTypeSpec;

namespace Sample
{
    [CodeGenSuppress("MockInputClient"]
    [CodeGenSuppress("MockInputClient", typeof(Foo))]
    public partial class MockInputClient
    {
    }
}
