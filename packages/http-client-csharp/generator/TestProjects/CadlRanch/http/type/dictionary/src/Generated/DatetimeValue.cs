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
    public partial class DatetimeValue
    {
        protected DatetimeValue() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<IDictionary<string, DateTimeOffset>> Get() => throw null;

        public virtual Task<ClientResult<IDictionary<string, DateTimeOffset>>> GetAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Put(IDictionary<string, DateTimeOffset> body) => throw null;

        public virtual Task<ClientResult> PutAsync(IDictionary<string, DateTimeOffset> body, CancellationToken cancellationToken = default) => throw null;
    }
}
