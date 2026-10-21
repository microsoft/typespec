using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult Send(string sourceIpAddressSyncProtocol, string targetDbNameSyncProtocol, string guestOsTypeSyncProtocol, string iPv4AddressSyncProtocol, string iPv6AddressSyncProtocol, RequestOptions options) => default;
        public virtual Task<ClientResult> SendAsync(string sourceIpAddressAsyncProtocol, string targetDbNameAsyncProtocol, string guestOsTypeAsyncProtocol, string iPv4AddressAsyncProtocol, string iPv6AddressAsyncProtocol, RequestOptions options) => default;
        public virtual ClientResult Send(string sourceIpAddressSyncConvenience, string targetDbNameSyncConvenience, string guestOsTypeSyncConvenience, string iPv4AddressSyncConvenience, string iPv6AddressSyncConvenience, CancellationToken cancellationToken = default) => default;
        public virtual Task<ClientResult> SendAsync(string sourceIpAddressAsyncConvenience, string targetDbNameAsyncConvenience, string guestOsTypeAsyncConvenience, string iPv4AddressAsyncConvenience, string iPv6AddressAsyncConvenience, CancellationToken cancellationToken = default) => default;
    }
}
