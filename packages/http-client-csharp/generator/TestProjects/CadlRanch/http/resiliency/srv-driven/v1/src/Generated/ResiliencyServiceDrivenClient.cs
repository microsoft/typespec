// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Resiliency.ServiceDriven
{
    public partial class ResiliencyServiceDrivenClient
    {
        protected ResiliencyServiceDrivenClient() => throw null;

        public ResiliencyServiceDrivenClient(Uri endpoint, string serviceDeploymentVersion) : this(endpoint, serviceDeploymentVersion, new ResiliencyServiceDrivenClientOptions()) => throw null;

        public ResiliencyServiceDrivenClient(Uri endpoint, string serviceDeploymentVersion, ResiliencyServiceDrivenClientOptions options) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult FromNone(RequestOptions options) => throw null;

        public virtual Task<ClientResult> FromNoneAsync(RequestOptions options) => throw null;

        public virtual ClientResult FromNone(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> FromNoneAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult FromOneRequired(string parameter, RequestOptions options) => throw null;

        public virtual Task<ClientResult> FromOneRequiredAsync(string parameter, RequestOptions options) => throw null;

        public virtual ClientResult FromOneRequired(string parameter, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> FromOneRequiredAsync(string parameter, CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult FromOneOptional(string parameter, RequestOptions options) => throw null;

        public virtual Task<ClientResult> FromOneOptionalAsync(string parameter, RequestOptions options) => throw null;

        public virtual ClientResult FromOneOptional(string parameter = null, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> FromOneOptionalAsync(string parameter = null, CancellationToken cancellationToken = default) => throw null;
    }
}
