using System.ClientModel.Primitives;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Sample.Models.RegularModel))]
    [ModelReaderWriterBuildable(typeof(Sample.Models.RemovedModel))]
    public partial class SampleContext
    {
    }
}

namespace Sample.Models
{
    public partial class RegularModel
    {
    }

    public partial class RemovedModel
    {
    }
}
