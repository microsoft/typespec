using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        // Restores the published overload that the current contract no longer generates.
        public static CompatibilityModel CompatibilityModel(string id = default, string kind = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel
    { }
}