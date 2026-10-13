using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public partial ClientResult Send(string customId, string customFilter, string customIpWire, RequestOptions customOptions);
        public partial Task<ClientResult> SendAsync(string customId, string customFilter, string customIpWire, RequestOptions customOptions);
        public partial ClientResult Send(string customId, string customIpValue, CancellationToken customToken);
        public partial Task<ClientResult> SendAsync(string customId, string customIpValue, CancellationToken customToken);
    }
}
