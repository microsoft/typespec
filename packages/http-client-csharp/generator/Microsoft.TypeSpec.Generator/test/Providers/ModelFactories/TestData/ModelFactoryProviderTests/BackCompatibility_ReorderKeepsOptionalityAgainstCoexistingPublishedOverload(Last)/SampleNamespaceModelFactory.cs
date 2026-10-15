using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        // The current contract produces this overload with 'id' first, so the reorder path rebuilds
        // it in the published order. Its optionality must survive that rebuild.
        public static CompatibilityModel CompatibilityModel(int? count = default, string id = default)
        { }

        // Coexisted with the overload above in the published contract and is restored below, so it
        // must not be treated as a competitor that forces the reordered signature to drop defaults.
        public static CompatibilityModel CompatibilityModel(string id = default, string kind = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel
    { }
}