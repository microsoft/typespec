using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        public static CompatibilityModel CompatibilityModel(int legacy) => CompatibilityModel(count: legacy);
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel { }
}
