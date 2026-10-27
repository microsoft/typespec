using System.ClientModel.Primitives;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Sample.Models.RegularModel))]
    public partial class SampleContext
    {
    }
}

namespace Sample.Models
{
    public partial class RegularModel
    {
    }
}
