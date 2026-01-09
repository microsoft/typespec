namespace Sample.Models
{
    public partial class ModelWithCustomProperty
    {
        // Custom property added through customization that references a framework type
        public Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions.ModelReaderWriterContextDefinitionTests.DependencyModel CustomDependencyProperty { get; set; }
    }
}
