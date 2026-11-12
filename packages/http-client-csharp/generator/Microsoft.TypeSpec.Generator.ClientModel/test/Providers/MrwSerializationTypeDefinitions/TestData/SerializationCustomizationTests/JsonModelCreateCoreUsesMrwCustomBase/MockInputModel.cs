#nullable disable

using System;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Sample.Models;

public partial class MockInputModel : MrwBase
{
}

public abstract class MrwBase
{
    protected virtual MrwBase JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => null;

    protected virtual MrwBase PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => null;
}
