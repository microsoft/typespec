// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace _Type._Array
{
    public partial class DurationValue
    {
        protected DurationValue() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<IList<TimeSpan>> Get() => throw null;

        public virtual Task<ClientResult<IList<TimeSpan>>> GetAsync() => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Put(IEnumerable<TimeSpan> body) => throw null;

        public virtual Task<ClientResult> PutAsync(IEnumerable<TimeSpan> body) => throw null;
    }
}
