#nullable disable

using System;
using System.ClientModel;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        internal virtual Task<ClientResult> RegisterSchemaAsync(string groupName, string schemaName, BinaryData schemaContent, SchemaContentTypeValues contentType, CancellationToken cancellationToken = default) { return null; }
        internal virtual ClientResult RegisterSchema(string groupName, string schemaName, BinaryData schemaContent, SchemaContentTypeValues contentType, CancellationToken cancellationToken = default) { return null; }
    }

    internal readonly partial struct SchemaContentTypeValues
    {
    }
}
