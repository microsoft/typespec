using System.Collections.Generic;
using UnbrandedTypeSpec;

namespace Sample;

[CodeGenSuppress("MockInputClient"]
[CodeGenSuppress("MockInputClient", typeof(bool))]
[CodeGenSuppress("MockInputClient", typeof(bool), typeof(int))]
public partial class MockInputClient
{
}
