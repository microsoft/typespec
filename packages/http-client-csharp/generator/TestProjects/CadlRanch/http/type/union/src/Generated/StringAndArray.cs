// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;
using _Type.Union.Models;

namespace _Type.Union
{
    public partial class StringAndArray
    {
        protected StringAndArray() => throw null;

        internal StringAndArray(ClientPipeline pipeline, Uri endpoint) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<GetResponse2> Get() => throw null;

        public virtual Task<ClientResult<GetResponse2>> GetAsync() => throw null;

        public virtual ClientResult Send(BinaryContent content, RequestOptions options) => throw null;

        public virtual Task<ClientResult> SendAsync(BinaryContent content, RequestOptions options) => throw null;

        public virtual ClientResult Send(StringAndArrayCases prop) => throw null;

        public virtual Task<ClientResult> SendAsync(StringAndArrayCases prop) => throw null;
    }
}
