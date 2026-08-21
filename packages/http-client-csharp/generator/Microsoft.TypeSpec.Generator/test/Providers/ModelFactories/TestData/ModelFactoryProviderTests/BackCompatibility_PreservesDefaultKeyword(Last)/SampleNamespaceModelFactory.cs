using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        public static CompatibilityModel CompatibilityModel(
            float value = default,
            string kind = "Unknown")
        { }
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel
    { }
}
