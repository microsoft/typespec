#nullable disable

using System;
using System.ClientModel;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        // This represents a previous contract where contentType appears before a named body parameter.
        internal virtual Task<ClientResult> RegisterSchemaAsync(string groupName, string schemaName, SchemaContentTypeValues contentType, BinaryData schemaContent, CancellationToken cancellationToken = default) { return null; }
        internal virtual ClientResult RegisterSchema(string groupName, string schemaName, SchemaContentTypeValues contentType, BinaryData schemaContent, CancellationToken cancellationToken = default) { return null; }
    }

    internal readonly partial struct SchemaContentTypeValues
    {
    }
}
