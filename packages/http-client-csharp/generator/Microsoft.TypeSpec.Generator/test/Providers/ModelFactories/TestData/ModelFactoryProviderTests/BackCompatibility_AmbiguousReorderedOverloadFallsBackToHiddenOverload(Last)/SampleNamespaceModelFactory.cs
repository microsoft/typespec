using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        // A reordering of the current overload. Keeping it visible with its published optionality
        // would make the single-argument call ambiguous with the custom overload.
        public static CompatibilityModel CompatibilityModel(
            bool flag = default,
            string id = default,
            string name = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel
    { }
}
