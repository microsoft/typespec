// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Type.Array;

namespace _Type._Array
{
    public partial class ModelValue
    {
        protected ModelValue() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<IList<InnerModel>> Get(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<IList<InnerModel>>> GetAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Put(IEnumerable<InnerModel> body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> PutAsync(IEnumerable<InnerModel> body, CancellationToken cancellationToken = default) => throw null;
    }
}
