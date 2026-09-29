using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public partial ClientResult Send(string customIpAddress, string version, RequestOptions options);
        public partial Task<ClientResult> SendAsync(string customIpAddress, string version, RequestOptions options);
        public partial ClientResult Send(string customIpAddress, CancellationToken cancellationToken);
        public partial Task<ClientResult> SendAsync(string customIpAddress, CancellationToken cancellationToken);
    }
}
