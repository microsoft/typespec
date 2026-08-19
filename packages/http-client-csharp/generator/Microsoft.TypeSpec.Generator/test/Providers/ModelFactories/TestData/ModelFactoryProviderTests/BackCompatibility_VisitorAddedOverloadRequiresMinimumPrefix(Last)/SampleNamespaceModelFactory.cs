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
        // Previously shipped overload with 'kind' earlier in the parameter list, all optional.
        public static CompatibilityModel CompatibilityModel(
            string id = default,
            string name = default,
            string kind = default,
            string image = default,
            string targetPort = default,
            bool? isMain = default)
        { }
    }
}