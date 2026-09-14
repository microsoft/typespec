using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        public static CompatibilityModel CompatibilityModel(
            string id,
            string description,
            string text)
        { }

        public static CompatibilityModel CompatibilityModel(
            bool isRegex = default,
            string id = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel
    { }
}
