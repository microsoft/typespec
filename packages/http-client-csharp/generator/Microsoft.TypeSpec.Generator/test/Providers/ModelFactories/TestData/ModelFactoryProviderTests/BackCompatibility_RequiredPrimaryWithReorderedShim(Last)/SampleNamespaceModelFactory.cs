using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        public static CompatibilityModel CompatibilityModel(
            string id,
            bool? allow,
            string kind)
        { return default; }

        public static CompatibilityModel CompatibilityModel(
            string id = default,
            string kind = default,
            bool? allow = default)
        { return default; }
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel
    { }
}
