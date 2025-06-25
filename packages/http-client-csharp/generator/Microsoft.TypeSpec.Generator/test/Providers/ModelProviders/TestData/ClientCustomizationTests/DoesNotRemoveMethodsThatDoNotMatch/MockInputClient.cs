using SampleTypeSpec;

namespace Sample;

[CodeGenSuppress("Method1")]
[CodeGenSuppress("Method2", typeof(bool)]
[CodeGenSuppress("Method3", typeof(string), typeof(int), typeof(bool))]
[CodeGenSuppress("Method4", typeof(string), typeof(int)]
[CodeGenSuppress("Method5", typeof(Foo))]
public partial class MockInputClient
{
}

public class Foo
{
}
