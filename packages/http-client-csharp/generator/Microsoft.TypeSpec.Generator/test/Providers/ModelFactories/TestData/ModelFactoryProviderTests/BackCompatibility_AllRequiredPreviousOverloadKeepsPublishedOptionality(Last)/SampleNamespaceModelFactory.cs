using Sample.Models;

namespace Sample.Models
{
    public partial class CompatibilityModel
    { }
}

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        // An all-required overload. It is only callable with exactly four arguments, so it can never
        // be reached by a shorter call to the all-optional overload below.
        public static CompatibilityModel CompatibilityModel(string id, string name, bool? flag, string kind)
        { }

        // The all-optional overload. Its published minimum is zero arguments and must stay that way.
        public static CompatibilityModel CompatibilityModel(string id = default, string name = default, int? count = default, string kind = default)
        { }
    }
}