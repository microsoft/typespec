using System.ClientModel.Primitives;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Sample.TestMrwSerialization))]
    [ModelReaderWriterBuildable(typeof(Sample.RemovedProviderWithFrameworkDependency))]
    public partial class SampleContext
    {
    }

    public partial class TestMrwSerialization
    {
    }

    internal partial class RemovedProviderWithFrameworkDependency
    {
    }
}
