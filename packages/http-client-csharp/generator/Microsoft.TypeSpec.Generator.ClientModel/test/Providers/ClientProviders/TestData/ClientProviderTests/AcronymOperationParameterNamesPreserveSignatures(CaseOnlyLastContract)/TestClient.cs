using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult Send(string sourceIpAddress, string targetDbName, string guestOsType, string iPv4Address, string iPv6Address, RequestOptions options) => default;
        public virtual Task<ClientResult> SendAsync(string sourceIPAddress, string targetDBName, string guestOSType, string ipv4Address, string ipv6Address, RequestOptions options) => default;
        public virtual ClientResult Send(string SourceIpAddress, string TargetDbName, string GuestOsType, string IPv4Address, string IPv6Address, CancellationToken cancellationToken = default) => default;
        public virtual Task<ClientResult> SendAsync(string SOURCEIPADDRESS, string TARGETDBNAME, string GUESTOSTYPE, string IPV4ADDRESS, string IPV6ADDRESS, CancellationToken cancellationToken = default) => default;
    }
}
