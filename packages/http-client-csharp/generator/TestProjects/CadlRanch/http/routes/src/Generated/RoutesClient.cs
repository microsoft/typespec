// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Routes._PathParameters;
using Routes._QueryParameters;

namespace Routes
{
    public partial class RoutesClient
    {
        public RoutesClient() : this(new Uri("http://localhost:3000"), new RoutesClientOptions()) => throw null;

        public RoutesClient(Uri endpoint, RoutesClientOptions options) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Fixed(RequestOptions options) => throw null;

        public virtual Task<ClientResult> FixedAsync(RequestOptions options) => throw null;

        public virtual ClientResult Fixed(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> FixedAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual PathParameters GetPathParametersClient() => throw null;

        public virtual QueryParameters GetQueryParametersClient() => throw null;

        public virtual InInterface GetInInterfaceClient() => throw null;
    }
}
