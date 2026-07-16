using System;
using System.ClientModel.Primitives;

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(object))]
    [Obsolete("bc")]
    public partial class SampleContext : ModelReaderWriterContext
    {
    }
}
