// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace _Type.Union
{
    public partial class MixedTypes
    {
        protected MixedTypes() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<GetResponse9> Get(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<GetResponse9>> GetAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Send(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> SendAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Send(MixedTypesCases prop, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> SendAsync(MixedTypesCases prop, CancellationToken cancellationToken = default) => throw null;
    }
}
