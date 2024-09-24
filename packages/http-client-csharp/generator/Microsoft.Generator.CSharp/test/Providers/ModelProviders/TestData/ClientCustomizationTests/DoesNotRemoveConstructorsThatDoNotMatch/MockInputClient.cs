using Microsoft.Generator.CSharp.Customization;

namespace Sample;

[CodeGenSuppress("MockInputClient", typeof(string)]
[CodeGenSuppress("MockInputClient", typeof(string), typeof(int), typeof(bool))]
public partial class MockInputClient
{
}
