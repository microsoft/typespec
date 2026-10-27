using System;
using System.ClientModel.Primitives;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Sample.Models.RegularModel))]
    [ModelReaderWriterBuildable(typeof(Sample.Models.ObsoleteCustomModel))]
    public partial class SampleContext
    {
    }
}

namespace Sample.Models
{
    public partial class RegularModel
    {
    }

    [Obsolete("This type is obsolete.")]
    public class ObsoleteCustomModel
    {
    }
}
