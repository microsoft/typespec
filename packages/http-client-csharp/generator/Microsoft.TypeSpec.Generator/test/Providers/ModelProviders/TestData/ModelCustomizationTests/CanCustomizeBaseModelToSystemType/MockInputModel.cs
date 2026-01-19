#nullable disable

namespace Sample.Models
{
    // This test case shows a model inheriting from a type in a different namespace.
    // ExternalNamespace.ExternalBaseType is defined in this file for compilation purposes.
    public partial class MockInputModel : ExternalNamespace.ExternalBaseType
    {
    }
}

namespace ExternalNamespace
{
    public class ExternalBaseType
    {
        public string Id { get; set; }
        public string Name { get; set; }
    }
}
