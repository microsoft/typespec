using System.ClientModel.Primitives;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Azure.ResponseError))]
    public partial class SampleContext
    {
    }
}
