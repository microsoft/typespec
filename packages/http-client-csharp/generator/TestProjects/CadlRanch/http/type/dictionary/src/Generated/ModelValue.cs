// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using _Type.Dictionary.Models;

namespace _Type.Dictionary
{
    public partial class ModelValue
    {
        protected ModelValue() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<IDictionary<string, InnerModel>> Get(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<IDictionary<string, InnerModel>>> GetAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Put(IDictionary<string, InnerModel> body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> PutAsync(IDictionary<string, InnerModel> body, CancellationToken cancellationToken = default) => throw null;
    }
}
