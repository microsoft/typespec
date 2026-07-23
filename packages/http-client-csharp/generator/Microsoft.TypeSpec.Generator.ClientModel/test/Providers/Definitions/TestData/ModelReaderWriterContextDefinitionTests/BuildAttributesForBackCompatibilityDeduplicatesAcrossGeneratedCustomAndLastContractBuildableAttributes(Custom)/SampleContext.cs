using System.ClientModel.Primitives;
using Sample.Models;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(CustomOnlyModel))]
    public partial class SampleContext
    {
    }
}
