using System.ClientModel.Primitives;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Sample.Models.RegularModel))]
    [ModelReaderWriterBuildable(typeof(Sample.Models.ExperimentalCustomModel))]
    public partial class SampleContext
    {
    }
}

namespace Sample.Models
{
    public partial class RegularModel
    {
    }

    public class ExperimentalCustomModel
    {
    }
}
