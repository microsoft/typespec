using System.ClientModel.Primitives;
using System.Text.Json;

namespace Sample.Models
{
    public class PreviousBase
    {
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
        }
    }

    public class DerivedModel : PreviousBase
    {
    }
}
