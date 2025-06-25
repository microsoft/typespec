using SampleTypeSpec;

namespace Sample;

[CodeGenSuppress("MockInputClient", typeof(string)]
[CodeGenSuppress("MockInputClient", typeof(string), typeof(int), typeof(bool))]
[CodeGenSuppress("MockInputClient", typeof(Foo))]
public partial class MockInputClient
{
}

public class Foo
{
}
