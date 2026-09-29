using System.ClientModel;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult GetIpAddress() => default!;
        public virtual Task<ClientResult> GetDbStatusAsync() => default!;
        public virtual ClientResult GetOsProfile() => default!;
        public virtual ClientResult GetIpv4Configuration() => default!;
        public virtual ClientResult GetIpv6Configuration() => default!;
        public virtual ClientResult GetIpAddresses() => default!;
        public virtual ClientResult GetIpUri() => default!;
        public virtual ClientResult GetDbUrl() => default!;
        public virtual Task<ClientResult> GetOsUrlAsync() => default!;
    }
}
