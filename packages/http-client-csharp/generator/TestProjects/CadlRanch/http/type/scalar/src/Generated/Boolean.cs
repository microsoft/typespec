// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace _Type.Scalar
{
    public partial class Boolean
    {
        protected Boolean() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<bool> Get(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<bool>> GetAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Put(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> PutAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Put(bool body, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> PutAsync(bool body, CancellationToken cancellationToken = default) => throw null;
    }
}
