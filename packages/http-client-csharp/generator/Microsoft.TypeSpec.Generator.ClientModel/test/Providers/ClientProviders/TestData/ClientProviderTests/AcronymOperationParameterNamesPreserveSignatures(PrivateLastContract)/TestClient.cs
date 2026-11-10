using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        private ClientResult Send(string sourceIpAddress, string targetDbName, string guestOsType, string iPv4Address, string iPv6Address, RequestOptions options) => default;
        private Task<ClientResult> SendAsync(string sourceIpAddress, string targetDbName, string guestOsType, string iPv4Address, string iPv6Address, RequestOptions options) => default;
        private ClientResult Send(string sourceIpAddress, string targetDbName, string guestOsType, string iPv4Address, string iPv6Address, CancellationToken cancellationToken = default) => default;
        private Task<ClientResult> SendAsync(string sourceIpAddress, string targetDbName, string guestOsType, string iPv4Address, string iPv6Address, CancellationToken cancellationToken = default) => default;
    }
}
