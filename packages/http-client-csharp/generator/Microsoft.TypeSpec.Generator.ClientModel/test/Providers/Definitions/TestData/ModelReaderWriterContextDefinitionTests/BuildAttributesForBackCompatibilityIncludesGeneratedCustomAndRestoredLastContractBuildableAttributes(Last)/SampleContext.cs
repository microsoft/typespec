using System.ClientModel.Primitives;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Sample.Models.GeneratedModelA))]
    [ModelReaderWriterBuildable(typeof(Sample.Models.GeneratedModelB))]
    [ModelReaderWriterBuildable(typeof(Sample.Models.CustomModel))]
    [ModelReaderWriterBuildable(typeof(Sample.Models.RemovedModelA))]
    [ModelReaderWriterBuildable(typeof(Sample.Models.RemovedModelB))]
    public partial class SampleContext
    {
    }
}

namespace Sample.Models
{
    public partial class GeneratedModelA
    {
    }

    public partial class GeneratedModelB
    {
    }

    public partial class CustomModel
    {
    }

    public partial class RemovedModelA
    {
    }

    public partial class RemovedModelB
    {
    }
}
