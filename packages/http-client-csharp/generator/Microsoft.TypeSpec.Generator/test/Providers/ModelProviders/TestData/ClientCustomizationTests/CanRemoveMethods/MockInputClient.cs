using System.Collections.Generic;
using SampleTypeSpec;

namespace Sample
{
    [CodeGenSuppress("Method1")]
    [CodeGenSuppress("Method2", typeof(bool)]
    [CodeGenSuppress("Method3", typeof(string), typeof(int))]
    [CodeGenSuppress("Method4", typeof(string), typeof(int?))]
    [CodeGenSuppress("Method5", typeof(string))]
    [CodeGenSuppress("Method6", typeof(Foo))]
    [CodeGenSuppress("Method7", typeof(BarNamespace.Foo))]
    [CodeGenSuppress("global::System.IAsyncDisposable.Method8"]
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
