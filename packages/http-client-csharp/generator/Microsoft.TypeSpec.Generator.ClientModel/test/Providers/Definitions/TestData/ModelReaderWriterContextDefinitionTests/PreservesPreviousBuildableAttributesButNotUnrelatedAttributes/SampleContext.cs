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

    public class RemovedModel
    {
    }

    public class ErrorObsoleteModel
    {
    }
}

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Models.CurrentModel))]
    [ModelReaderWriterBuildable(typeof(Models.PreviousModel))]
    [ModelReaderWriterBuildable(typeof(Models.ExperimentalPreviousModel))]
    [ModelReaderWriterBuildable(typeof(Models.RemovedModel))]
    [ModelReaderWriterBuildable(typeof(Models.ErrorObsoleteModel))]
    [EditorBrowsable(EditorBrowsableState.Never)]
    public partial class SampleContext : ModelReaderWriterContext
    {
    }
}
