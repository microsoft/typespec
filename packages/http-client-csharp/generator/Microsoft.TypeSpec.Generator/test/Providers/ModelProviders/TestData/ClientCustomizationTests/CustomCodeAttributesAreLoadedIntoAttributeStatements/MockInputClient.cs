using System.Collections.Generic;
using UnbrandedTypeSpec;

namespace Sample;

[CodeGenSuppress("MockInputClient"]
[CodeGenSuppress("MockInputClient", typeof(bool))]
[CodeGenSuppress("MockInputClient", typeof(bool), typeof(int))]
[CodeGenSerialization("MockInputClient", SerializationValueHook = "foo", DeserializationValueHook = "bar"]
public partial class MockInputClient
{
}
