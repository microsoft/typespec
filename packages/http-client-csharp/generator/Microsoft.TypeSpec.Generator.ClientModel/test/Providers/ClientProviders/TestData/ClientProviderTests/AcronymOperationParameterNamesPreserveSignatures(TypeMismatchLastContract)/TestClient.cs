using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult Send(int sourceIpAddress, int targetDbName, int guestOsType, int iPv4Address, int iPv6Address, RequestOptions options) => default;
        public virtual Task<ClientResult> SendAsync(int sourceIpAddress, int targetDbName, int guestOsType, int iPv4Address, int iPv6Address, RequestOptions options) => default;
        public virtual ClientResult Send(int sourceIpAddress, int targetDbName, int guestOsType, int iPv4Address, int iPv6Address, CancellationToken cancellationToken = default) => default;
        public virtual Task<ClientResult> SendAsync(int sourceIpAddress, int targetDbName, int guestOsType, int iPv4Address, int iPv6Address, CancellationToken cancellationToken = default) => default;
    }
}
