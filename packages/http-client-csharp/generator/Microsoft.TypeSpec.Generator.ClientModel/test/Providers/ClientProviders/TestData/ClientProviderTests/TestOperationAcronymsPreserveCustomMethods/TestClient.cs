using System.ClientModel;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public partial ClientResult GetIpUri(CancellationToken cancellationToken);
        public partial Task<ClientResult> GetIpUriAsync(CancellationToken cancellationToken);
    }
}
