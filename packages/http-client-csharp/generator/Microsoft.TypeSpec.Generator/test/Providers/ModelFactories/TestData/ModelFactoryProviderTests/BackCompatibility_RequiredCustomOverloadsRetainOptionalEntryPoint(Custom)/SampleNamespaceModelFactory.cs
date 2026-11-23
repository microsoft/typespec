using System.ComponentModel;
using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        [EditorBrowsable(EditorBrowsableState.Never)]
        public static CompatibilityModel CompatibilityModel(string id)
            => CompatibilityModel(id: id, name: default, enabled: default);

        [EditorBrowsable(EditorBrowsableState.Never)]
        public static CompatibilityModel CompatibilityModel(string id, bool? enabled)
            => CompatibilityModel(id: id, name: default, enabled: enabled);
    }
}

namespace Sample.Models
{
    public partial class CompatibilityModel { }
}
