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
        // A compatibility shim published by an earlier version.
        public static CompatibilityModel CompatibilityModel(string id, int? count = default)
        { }
        // The published overload. 'id, count' is a positional prefix of it, so the two only
        // coexisted safely because both shipped with their trailing parameters optional.
        public static CompatibilityModel CompatibilityModel(string id, int? count = default, string extra = default, string other = default)
        { }
    }
}