// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace _Type.Dictionary
{
    public partial class DurationValue
    {
        protected DurationValue() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<IDictionary<string, TimeSpan>> Get() => throw null;

        public virtual Task<ClientResult<IDictionary<string, TimeSpan>>> GetAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Put(IDictionary<string, TimeSpan> body) => throw null;

        public virtual Task<ClientResult> PutAsync(IDictionary<string, TimeSpan> body, CancellationToken cancellationToken = default) => throw null;
    }
}
