using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        // Still matches the current contract's natural parameter order, so this overload must be
        // preserved rather than replaced by the reordered overload below.
        public static CompatibilityModel CompatibilityModel(
            string id = default,
            string kind = default,
            string image = default,
            bool? isMain = default)
        { }

        // The previously shipped overload with 'kind' moved to the end.
        public static CompatibilityModel CompatibilityModel(
            string id = default,
            string image = default,
            bool? isMain = default,
            string kind = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel
    { }
}
