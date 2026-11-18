using System.ComponentModel;
using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        public static CompatibilityModel CompatibilityModel(string id, string name, bool? enabled) => default;

        [EditorBrowsable(EditorBrowsableState.Never)]
        public static CompatibilityModel CompatibilityModel(string id = default, bool? enabled = default) => default;
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel { }
}
