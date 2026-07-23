using System.ClientModel.Primitives;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Sample.Models.CustomModel))]
    public partial class SampleContext
    {
    }
}

namespace Sample.Models
{
    public partial class CustomModel
    {
    }
}
