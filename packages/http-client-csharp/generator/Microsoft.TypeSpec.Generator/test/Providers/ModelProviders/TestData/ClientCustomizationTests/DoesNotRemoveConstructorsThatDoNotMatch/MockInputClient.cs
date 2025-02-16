using UnbrandedTypeSpec;

namespace Sample;

[CodeGenSuppress("MockInputClient", typeof(string)]
[CodeGenSuppress("MockInputClient", typeof(string), typeof(int), typeof(bool))]
public partial class MockInputClient
{
}
