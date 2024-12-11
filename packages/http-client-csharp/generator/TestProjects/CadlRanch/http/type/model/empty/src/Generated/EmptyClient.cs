// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using _Type.Model.Empty.Models;

namespace _Type.Model.Empty
{
    public partial class EmptyClient
    {
        public EmptyClient() : this(new Uri("http://localhost:3000"), new EmptyClientOptions()) => throw null;

        public EmptyClient(Uri endpoint, EmptyClientOptions options) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult PutEmpty(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutEmptyAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult PutEmpty(EmptyInput input, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> PutEmptyAsync(EmptyInput input, CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult GetEmpty(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetEmptyAsync(RequestOptions options) => throw null;

        public virtual ClientResult<EmptyOutput> GetEmpty(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<EmptyOutput>> GetEmptyAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult PostRoundTripEmpty(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PostRoundTripEmptyAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult<EmptyInputOutput> PostRoundTripEmpty(EmptyInputOutput body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<EmptyInputOutput>> PostRoundTripEmptyAsync(EmptyInputOutput body, CancellationToken cancellationToken = default) => throw null;
    }
}
