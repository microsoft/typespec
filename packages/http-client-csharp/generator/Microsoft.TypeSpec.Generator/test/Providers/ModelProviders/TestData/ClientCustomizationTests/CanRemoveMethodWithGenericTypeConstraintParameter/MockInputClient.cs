using System;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample
{
    [CodeGenSuppress("Method1", typeof(IDisposable))]
    public partial class MockInputClient
    {
    }
}
