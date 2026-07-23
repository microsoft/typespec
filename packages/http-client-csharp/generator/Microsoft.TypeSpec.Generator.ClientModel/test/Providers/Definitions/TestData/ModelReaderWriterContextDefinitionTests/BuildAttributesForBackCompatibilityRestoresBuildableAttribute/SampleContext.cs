using System.ComponentModel;
using System.ClientModel.Primitives;
using Sample.Models;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(LastContractOnlyModel))]
    [Description("bc")]
    public partial class SampleContext : ModelReaderWriterContext
    {
    }
}
