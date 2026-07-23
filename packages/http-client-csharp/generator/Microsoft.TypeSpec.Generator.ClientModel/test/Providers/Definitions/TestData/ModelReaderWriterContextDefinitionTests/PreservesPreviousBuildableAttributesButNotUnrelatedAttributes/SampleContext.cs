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

    public class ErrorObsoleteOuter
    {
        public class NestedModel
        {
        }
    }

    public class GenericModel<T>
    {
    }

    public class ErrorObsoleteTypeArgument
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
    [ModelReaderWriterBuildable(typeof(Models.ErrorObsoleteOuter.NestedModel))]
    [ModelReaderWriterBuildable(typeof(Models.GenericModel<Models.ErrorObsoleteTypeArgument>))]
    [EditorBrowsable(EditorBrowsableState.Never)]
    public partial class SampleContext : ModelReaderWriterContext
    {
    }
}
