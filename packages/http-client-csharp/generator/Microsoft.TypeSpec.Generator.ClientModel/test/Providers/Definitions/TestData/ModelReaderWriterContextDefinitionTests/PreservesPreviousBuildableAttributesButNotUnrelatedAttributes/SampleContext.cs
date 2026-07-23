using System.ClientModel.Primitives;
using System.ComponentModel;

namespace Sample.Models
{
    public class CurrentModel
    {
    }

    public class PreviousModel
    {
    }

    public class ExperimentalPreviousModel
    {
    }
}

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Models.CurrentModel))]
    [ModelReaderWriterBuildable(typeof(Models.PreviousModel))]
    [ModelReaderWriterBuildable(typeof(Models.ExperimentalPreviousModel))]
    [EditorBrowsable(EditorBrowsableState.Never)]
    public partial class SampleContext : ModelReaderWriterContext
    {
    }
}
