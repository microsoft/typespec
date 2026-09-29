using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult Send(string sourceIpAddress, string targetDbName, string guestOsType, string iPv4Address, string iPv6Address, RequestOptions options) => default;
        public virtual Task<ClientResult> SendAsync(string sourceIpAddress, string targetDbName, string guestOsType, string iPv4Address, string iPv6Address, RequestOptions options) => default;
        public virtual ClientResult Send(string sourceIpAddress, string targetDbName, string guestOsType, string iPv4Address, string iPv6Address, CancellationToken cancellationToken = default) => default;
        public virtual Task<ClientResult> SendAsync(string sourceIpAddress, string targetDbName, string guestOsType, string iPv4Address, string iPv6Address, CancellationToken cancellationToken = default) => default;
    }
}
