using System;
using System.ClientModel.Primitives;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Sample.Models.ActiveCustomModel))]
    [ModelReaderWriterBuildable(typeof(Sample.Models.ObsoleteCustomModel))]
    public partial class SampleContext
    {
    }
}

namespace Sample.Models
{
    public class ActiveCustomModel
    {
    }

    [Obsolete("This type is obsolete.")]
    public class ObsoleteCustomModel
    {
    }
}
