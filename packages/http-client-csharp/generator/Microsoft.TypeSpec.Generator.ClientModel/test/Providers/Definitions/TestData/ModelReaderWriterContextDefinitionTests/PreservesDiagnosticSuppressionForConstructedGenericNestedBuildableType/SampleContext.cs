using System.ClientModel.Primitives;

namespace Sample.Models
{
    public class TypeArgument
    {
    }

    public class Outer<T>
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
    [ModelReaderWriterBuildable(typeof(Models.Outer<Models.TypeArgument>.Middle.DeepModel))]
    public partial class SampleContext : ModelReaderWriterContext
    {
    }
}
