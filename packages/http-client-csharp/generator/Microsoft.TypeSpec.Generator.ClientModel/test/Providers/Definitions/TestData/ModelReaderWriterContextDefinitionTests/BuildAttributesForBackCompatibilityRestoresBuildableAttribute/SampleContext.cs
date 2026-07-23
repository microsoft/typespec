using System.ComponentModel;
using System.ClientModel.Primitives;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(object))]
    [Description("bc")]
    public partial class SampleContext : ModelReaderWriterContext
    {
    }
}
