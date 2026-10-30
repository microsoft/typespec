using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        public static CompatibilityModel CompatibilityModel(string id) => default;

        public static CompatibilityModel CompatibilityModel(string id, bool? enabled) => default;

        public static CompatibilityModel CompatibilityModel(string id = default, string name = default, bool? enabled = default) => default;
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel { }
}
