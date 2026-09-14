using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        public static CompatibilityModel CompatibilityModel(
            string id = default,
            string unit = default,
            int? properties = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel
    { }
}
