using System.ClientModel;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult GetUrl() => default!;

        public virtual Task<ClientResult> GetUrlAsync() => default!;
    }
}
