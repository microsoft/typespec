using System;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Sample.Models
{
    public class TrackedResource
    {
        protected virtual string PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
            => throw new NotImplementedException();

        protected virtual string JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            => throw new NotImplementedException();
    }
}
