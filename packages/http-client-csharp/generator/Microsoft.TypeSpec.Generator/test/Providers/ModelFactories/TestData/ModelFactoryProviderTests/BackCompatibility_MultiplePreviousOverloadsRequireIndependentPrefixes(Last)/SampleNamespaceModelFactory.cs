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
        // Positional prefix of the current method (differs only past 'count'), so no argument
        // count distinguishes the two and every parameter must become required.
        public static CompatibilityModel CompatibilityModel(
            string id = default,
            string name = default,
            int? count = default,
            string kind = default)
        { }

        // Reordered: 'kind' moved ahead of 'count', so supplying three arguments already
        // disambiguates it and 'count' keeps the optionality it shipped with.
        public static CompatibilityModel CompatibilityModel(
            string id = default,
            string name = default,
            string kind = default,
            int? count = default)
        { }
    }
}