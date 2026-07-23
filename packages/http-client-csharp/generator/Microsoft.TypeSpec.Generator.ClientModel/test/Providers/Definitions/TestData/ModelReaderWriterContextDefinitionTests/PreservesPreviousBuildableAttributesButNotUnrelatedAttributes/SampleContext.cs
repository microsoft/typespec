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
}

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Models.CurrentModel))]
    [ModelReaderWriterBuildable(typeof(Models.PreviousModel))]
    [EditorBrowsable(EditorBrowsableState.Never)]
    public partial class SampleContext : ModelReaderWriterContext
    {
    }
}
