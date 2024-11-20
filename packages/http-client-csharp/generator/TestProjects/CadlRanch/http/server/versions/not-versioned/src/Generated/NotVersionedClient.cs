// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Server.Versions.NotVersioned
{
    public partial class NotVersionedClient
    {
        protected NotVersionedClient() => throw null;

        public NotVersionedClient(Uri endpoint) : this(endpoint, new NotVersionedClientOptions()) => throw null;

        public NotVersionedClient(Uri endpoint, NotVersionedClientOptions options) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult WithoutApiVersion(RequestOptions options) => throw null;

        public virtual Task<ClientResult> WithoutApiVersionAsync(RequestOptions options) => throw null;

        public virtual ClientResult WithoutApiVersion() => throw null;

        public virtual Task<ClientResult> WithoutApiVersionAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult WithQueryApiVersion(string apiVersion, RequestOptions options) => throw null;

        public virtual Task<ClientResult> WithQueryApiVersionAsync(string apiVersion, RequestOptions options) => throw null;

        public virtual ClientResult WithQueryApiVersion(string apiVersion) => throw null;

        public virtual Task<ClientResult> WithQueryApiVersionAsync(string apiVersion, CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult WithPathApiVersion(string apiVersion, RequestOptions options) => throw null;

        public virtual Task<ClientResult> WithPathApiVersionAsync(string apiVersion, RequestOptions options) => throw null;

        public virtual ClientResult WithPathApiVersion(string apiVersion) => throw null;

        public virtual Task<ClientResult> WithPathApiVersionAsync(string apiVersion, CancellationToken cancellationToken = default) => throw null;
    }
}
