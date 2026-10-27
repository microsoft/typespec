using System;
using System.ClientModel.Primitives;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Sample.Models.RegularModel))]
    [ModelReaderWriterBuildable(typeof(System.BinaryData))]
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
