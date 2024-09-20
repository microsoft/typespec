using System.Collections.Generic;
using Microsoft.Generator.CSharp.Customization;

namespace Sample;

[CodeGenSuppress("Method1")]
[CodeGenSuppress("Method2", typeof(bool)]
[CodeGenSuppress("Method3", typeof(string), typeof(int))]
public partial class MockInputClient
{
}
