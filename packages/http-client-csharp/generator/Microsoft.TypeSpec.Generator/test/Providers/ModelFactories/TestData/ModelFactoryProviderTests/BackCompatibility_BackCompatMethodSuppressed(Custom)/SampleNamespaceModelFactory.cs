using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Customizations;
using Sample.Models;

namespace Sample.Namespace
{
    [CodeGenSuppress("PublicModel1", typeof(string), typeof(Thing), typeof(IEnumerable<string>))]
    public static partial class SampleNamespaceModelFactory
    {
    }
}

namespace Sample.Models
{
    public partial class Thing { }
}
