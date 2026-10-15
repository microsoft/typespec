using System.ClientModel;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public partial ClientResult GetIpUri(CancellationToken cancellationToken);
        public partial Task<ClientResult> GetIpUriAsync(CancellationToken cancellationToken);
        private partial ClientResult GetIpPrivate(CancellationToken cancellationToken);
        private partial Task<ClientResult> GetIpPrivateAsync(CancellationToken cancellationToken);
        internal partial ClientResult GetIpInternal(CancellationToken cancellationToken);
        internal partial Task<ClientResult> GetIpInternalAsync(CancellationToken cancellationToken);
    }
}
