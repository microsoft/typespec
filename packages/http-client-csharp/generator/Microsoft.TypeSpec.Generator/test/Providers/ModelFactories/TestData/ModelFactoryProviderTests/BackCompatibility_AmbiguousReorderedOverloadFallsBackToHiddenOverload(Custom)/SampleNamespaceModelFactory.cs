using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        public static CompatibilityModel CompatibilityModel(
            string id,
            string name = default,
            string extra = default,
            string other = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel
    { }
}
