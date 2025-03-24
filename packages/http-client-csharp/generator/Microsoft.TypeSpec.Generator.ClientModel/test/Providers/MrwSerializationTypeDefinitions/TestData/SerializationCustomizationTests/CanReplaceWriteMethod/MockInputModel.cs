#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json;
using Sample;

namespace Sample.Models
{
    /// <summary></summary>
    public partial class MockInputModel : IJsonModel<MockInputModel>
    {
        void IJsonModel<MockInputModel>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            => throw new NotImplementedException();

        BinaryData IPersistableModel<MockInputModel>.Write(ModelReaderWriterOptions options)
            => throw new NotImplementedException();
    }
}
