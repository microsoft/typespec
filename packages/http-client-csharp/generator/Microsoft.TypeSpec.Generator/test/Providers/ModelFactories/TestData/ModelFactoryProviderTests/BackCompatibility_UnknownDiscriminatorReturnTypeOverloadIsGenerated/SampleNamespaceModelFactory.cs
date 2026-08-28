using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        // Previous contract shipped a factory whose return type was the Unknown* discriminator model itself,
        // rather than the abstract base. It must be restored as a hidden back-compat overload.
        public static UnknownAbstractModel UnknownAbstractModel(string prop1 = default, string kind = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class UnknownAbstractModel
    { }
}
