using System.Collections.Generic;
using SampleTypeSpec;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample
{
    [CodeGenSuppress("MockInputClient"]
    [CodeGenSuppress("MockInputClient", typeof(Foo))]
    public partial class MockInputClient
    {
    }
}
