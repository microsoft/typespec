#nullable disable

using System.ClientModel.Primitives;
using System.Text.Json;

namespace Sample.Models;

public partial class MockInputModel : NonVirtualBase
{
}

public class NonVirtualBase
{
    protected void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
    {
    }
}
