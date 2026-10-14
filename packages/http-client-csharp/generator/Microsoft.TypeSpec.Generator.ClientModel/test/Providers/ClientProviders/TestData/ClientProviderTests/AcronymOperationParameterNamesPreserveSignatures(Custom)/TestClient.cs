using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public partial ClientResult Send(string customIpAddress, string customDbName, string customOsType, string customIPv4Address, string customIPv6Address, RequestOptions options);
        public partial Task<ClientResult> SendAsync(string customIpAddress, string customDbName, string customOsType, string customIPv4Address, string customIPv6Address, RequestOptions options);
        public partial ClientResult Send(string customIpAddress, string customDbName, string customOsType, string customIPv4Address, string customIPv6Address, CancellationToken cancellationToken);
        public partial Task<ClientResult> SendAsync(string customIpAddress, string customDbName, string customOsType, string customIPv4Address, string customIPv6Address, CancellationToken cancellationToken);
    }
}
