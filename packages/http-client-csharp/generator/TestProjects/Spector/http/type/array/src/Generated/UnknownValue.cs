// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace _Type._Array
{
    public partial class UnknownValue
    {
        protected UnknownValue() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<IReadOnlyList<BinaryData>> Get(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<IReadOnlyList<BinaryData>>> GetAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Put(IEnumerable<BinaryData> body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> PutAsync(IEnumerable<BinaryData> body, CancellationToken cancellationToken = default) => throw null;
    }
}
