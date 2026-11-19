using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        public static CompatibilityModel CompatibilityModel(int count, string id = default) => default;

        public static CompatibilityModel CompatibilityModel(int legacy) => default;
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel { }
}
