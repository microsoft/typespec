// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Type.Union;

namespace _Type.Union
{
    public partial class EnumsOnly
    {
        protected EnumsOnly() => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual ClientResult Get(RequestOptions options) => throw null;

        public virtual Task<ClientResult> GetAsync(RequestOptions options) => throw null;

        public virtual ClientResult<GetResponse3> Get(CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult<GetResponse3>> GetAsync(CancellationToken cancellationToken = default) => throw null;

        public virtual ClientResult Send(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual Task<ClientResult> SendAsync(BinaryContent content, RequestOptions options = null) => throw null;

        public virtual ClientResult Send(EnumsOnlyCases prop, CancellationToken cancellationToken = default) => throw null;

        public virtual Task<ClientResult> SendAsync(EnumsOnlyCases prop, CancellationToken cancellationToken = default) => throw null;
    }
}
