// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading.Tasks;
using _Type.Dictionary.Models;

namespace _Type.Dictionary
{
    public partial class RecursiveModelValue
    {
        protected RecursiveModelValue() => throw null;

        internal RecursiveModelValue(ClientPipeline pipeline, Uri endpoint) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<IDictionary<string, InnerModel>> Get() => throw null;

        public virtual Task<ClientResult<IDictionary<string, InnerModel>>> GetAsync() => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options) => throw null;

        public virtual ClientResult Put(IDictionary<string, InnerModel> body) => throw null;

        public virtual Task<ClientResult> PutAsync(IDictionary<string, InnerModel> body) => throw null;
    }
}
