// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace _Type.Dictionary
{
    public partial class StringValue
    {
        protected StringValue() => throw null;

        internal StringValue(ClientPipeline pipeline, Uri endpoint) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<IDictionary<string, string>> Get() => throw null;

        public virtual Task<ClientResult<IDictionary<string, string>>> GetAsync() => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options) => throw null;

        public virtual ClientResult Put(IDictionary<string, string> body) => throw null;

        public virtual Task<ClientResult> PutAsync(IDictionary<string, string> body) => throw null;
    }
}
