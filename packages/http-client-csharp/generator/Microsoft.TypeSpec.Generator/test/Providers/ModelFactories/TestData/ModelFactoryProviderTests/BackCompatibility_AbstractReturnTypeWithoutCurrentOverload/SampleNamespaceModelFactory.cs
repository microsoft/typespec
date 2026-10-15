using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        public static AbstractModel AbstractModelOldName(string prop1 = default, string kind = default)
        { }
    }
}

namespace Sample.Models
{
    public abstract partial class AbstractModel
    { }
}
