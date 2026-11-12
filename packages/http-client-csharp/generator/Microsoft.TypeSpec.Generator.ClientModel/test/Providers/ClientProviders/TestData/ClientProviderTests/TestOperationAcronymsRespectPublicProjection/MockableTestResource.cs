using System.ClientModel;
using System.Threading.Tasks;

namespace Sample
{
    public partial class MockableTestResource
    {
        public virtual Task<ClientResult> GetIpAddressAsync() => default!;
        public virtual ClientResult GetIpUri() => default!;
    }
}
