using System.ClientModel.Primitives;

namespace Sample.Models
{
    public class Outer
    {
        public class Middle
        {
            public class DeepModel
            {
            }
        }
    }
}

namespace Sample
{
    [ModelReaderWriterBuildable(typeof(Models.Outer.Middle.DeepModel))]
    public partial class SampleContext : ModelReaderWriterContext
    {
    }
}
