using Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions.DependencyModel;

namespace Sample.Models
{
    public partial class ModelWithCustomProperty
    {
        // Custom property added through customization that references a buildable type
        DependencyModel CustomDependencyProperty { get; set; }
    }
}
