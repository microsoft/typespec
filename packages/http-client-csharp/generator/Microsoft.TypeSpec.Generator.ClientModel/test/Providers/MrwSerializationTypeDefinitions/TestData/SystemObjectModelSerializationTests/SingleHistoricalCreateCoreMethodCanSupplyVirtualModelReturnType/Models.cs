using System;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Sample.Models
{
    public class PersistableOnlyResource
    {
        protected virtual PersistableOnlyResource PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
            => throw new NotImplementedException();
    }

    public class JsonOnlyResource
    {
        protected virtual JsonOnlyResource JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            => throw new NotImplementedException();
    }
}
