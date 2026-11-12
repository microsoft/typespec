using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult Send(string id, string filter, string sourceIpAddressWire, RequestOptions legacyOptions) => default;
        public virtual Task<ClientResult> SendAsync(string id, string filter, string sourceIpAddressWire, RequestOptions legacyOptions) => default;
        public virtual ClientResult Send(string id, string sourceIpAddressValue = default, CancellationToken cancellationToken = default) => default;
        public virtual Task<ClientResult> SendAsync(string id, string sourceIpAddressValue = default, CancellationToken cancellationToken = default) => default;
    }
}
