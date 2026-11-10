#nullable disable

using System.ClientModel.Primitives;
using System.Text.Json;

namespace Sample.Models;

public partial class MockInputModel : SealedBase
{
}

public class SealedBase : SealedBaseHook
{
    protected sealed override void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
    {
    }
}

public class SealedBaseHook
{
    protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
    {
    }
}
