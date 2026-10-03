using System;
using System.ClientModel.Primitives;
using System.Text.Json;

namespace Sample.Models
{
    public class PreviousBase
    {
    }

    public class DerivedModel : PreviousBase
    {
        protected virtual PreviousBase PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
            => throw new NotImplementedException();

        protected virtual PreviousBase JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            => throw new NotImplementedException();
    }
}
