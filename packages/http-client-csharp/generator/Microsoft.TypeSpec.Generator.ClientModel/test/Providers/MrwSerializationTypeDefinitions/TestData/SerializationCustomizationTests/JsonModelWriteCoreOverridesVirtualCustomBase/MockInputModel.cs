#nullable disable

using System.ClientModel.Primitives;
using System.Text.Json;

namespace Sample.Models;

public partial class MockInputModel : VirtualBase
{
}

public class VirtualBase
{
    protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
    {
    }
}
