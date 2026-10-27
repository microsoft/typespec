#nullable disable

using System.ClientModel.Primitives;

namespace Sample.Models;

public partial class MockInputModel : MismatchedBase
{
}

public class MismatchedBase
{
    protected virtual void JsonModelWriteCore(ModelReaderWriterOptions options)
    {
    }
}
