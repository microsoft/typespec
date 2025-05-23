// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace _Type.Model.Inheritance.NestedDiscriminator
{
    public partial class NestedDiscriminatorClient
    {
        public NestedDiscriminatorClient() : this(new Uri("http://localhost:3000"), new NestedDiscriminatorClientOptions()) => throw null;

        public NestedDiscriminatorClient(Uri endpoint, NestedDiscriminatorClientOptions options) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult GetModel(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetModelAsync(RequestOptions options) => throw null;

        public virtual ClientResult<Fish> GetModel(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<Fish>> GetModelAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult PutModel(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutModelAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult PutModel(Fish input, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> PutModelAsync(Fish input, CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult GetRecursiveModel(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetRecursiveModelAsync(RequestOptions options) => throw null;

        public virtual ClientResult<Fish> GetRecursiveModel(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<Fish>> GetRecursiveModelAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult PutRecursiveModel(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutRecursiveModelAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult PutRecursiveModel(Fish input, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> PutRecursiveModelAsync(Fish input, CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult GetMissingDiscriminator(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetMissingDiscriminatorAsync(RequestOptions options) => throw null;

        public virtual ClientResult<Fish> GetMissingDiscriminator(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<Fish>> GetMissingDiscriminatorAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult GetWrongDiscriminator(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetWrongDiscriminatorAsync(RequestOptions options) => throw null;

        public virtual ClientResult<Fish> GetWrongDiscriminator(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<Fish>> GetWrongDiscriminatorAsync(CancellationToken cancellationToken = default) => throw null;
    }
}
