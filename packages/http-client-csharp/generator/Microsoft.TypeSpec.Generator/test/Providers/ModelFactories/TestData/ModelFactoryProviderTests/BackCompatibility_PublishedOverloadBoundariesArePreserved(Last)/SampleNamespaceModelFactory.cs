using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        public static CompatibilityModel CompatibilityModel(
            string id,
            bool? allow,
            string kind)
        { }

        public static CompatibilityModel CompatibilityModel(
            string id = default,
            string kind = default,
            bool? allow = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel
    { }
}
