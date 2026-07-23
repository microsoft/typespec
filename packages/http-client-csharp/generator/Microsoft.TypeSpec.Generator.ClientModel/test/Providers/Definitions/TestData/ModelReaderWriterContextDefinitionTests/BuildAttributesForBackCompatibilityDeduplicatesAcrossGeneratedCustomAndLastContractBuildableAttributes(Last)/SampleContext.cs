using System.ClientModel.Primitives;
using Sample.Models;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(CustomOnlyModel))]
    [ModelReaderWriterBuildable(typeof(GeneratedModel))]
    [ModelReaderWriterBuildable(typeof(LastContractOnlyModel))]
    public partial class SampleContext : ModelReaderWriterContext
    {
    }
}
