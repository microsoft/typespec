using Microsoft.TypeSpec.Generator.Customizations;
using Sample.Models;

namespace Sample.Namespace
{
    [CodeGenSuppress("CompatibilityModel", typeof(string), typeof(string), typeof(string), typeof(bool?), typeof(string))]
    public static partial class SampleNamespaceModelFactory
    {
        public static CompatibilityModel CompatibilityModel(
            string id,
            string name,
            bool? enabled,
            string description,
            string kind)
        { }
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel
    { }
}
