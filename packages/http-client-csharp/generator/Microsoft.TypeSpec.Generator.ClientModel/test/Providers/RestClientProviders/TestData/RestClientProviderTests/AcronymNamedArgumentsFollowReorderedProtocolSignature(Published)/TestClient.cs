using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult Send(string sourceIpAddress, string version = null, RequestOptions options = null) => default;
        public virtual Task<ClientResult> SendAsync(string sourceIpAddress, string version = null, RequestOptions options = null) => default;
        public virtual ClientResult Send(string sourceIpAddress, CancellationToken cancellationToken = default) => default;
        public virtual Task<ClientResult> SendAsync(string sourceIpAddress, CancellationToken cancellationToken = default) => default;
    }
}
