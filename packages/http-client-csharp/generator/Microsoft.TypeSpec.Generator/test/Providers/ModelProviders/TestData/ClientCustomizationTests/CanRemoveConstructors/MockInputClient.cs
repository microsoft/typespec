using System.Collections.Generic;
using SampleTypeSpec;

namespace Sample
{
    [CodeGenSuppress("MockInputClient"]
    [CodeGenSuppress("MockInputClient", typeof(bool))]
    [CodeGenSuppress("MockInputClient", typeof(bool), typeof(int))]
    [CodeGenSuppress("MockInputClient", typeof(Foo))]
    [CodeGenSuppress("MockInputClient", typeof(BarNamespace.Foo))]
    public partial class MockInputClient
    {
    }

    public class Foo
    {
    }
}

namespace BarNamespace
{
    public class Foo
    {
    }
}
