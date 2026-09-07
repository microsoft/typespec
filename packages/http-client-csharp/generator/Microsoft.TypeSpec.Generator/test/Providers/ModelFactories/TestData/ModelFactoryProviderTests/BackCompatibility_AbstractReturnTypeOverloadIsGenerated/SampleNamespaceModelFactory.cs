using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        // Previous contract shipped a factory overload for the abstract AbstractModel with fewer
        // parameters (before prop2 was added). It must be restored as a hidden back-compat overload
        // even though the current factory instantiates the Unknown* derived type.
        public static AbstractModel AbstractModel(string prop1 = default, string kind = default)
        { }
    }
}

namespace Sample.Models
{
    public abstract partial class AbstractModel
    { }
}
