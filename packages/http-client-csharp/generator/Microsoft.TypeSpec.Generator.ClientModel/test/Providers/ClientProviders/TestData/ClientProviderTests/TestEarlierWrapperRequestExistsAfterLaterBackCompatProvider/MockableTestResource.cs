using System.ClientModel;
using System.Threading.Tasks;

namespace Sample
{
    public partial class MockableTestResource
    {
        public virtual ClientResult GetUrl() => default!;

        public virtual Task<ClientResult> GetUrlAsync() => default!;

        public virtual ClientResult ListUrl(string contentType, object body) => default!;
    }

    public partial class NewMockableTestResource
    {
        public virtual ClientResult GetUri(string contentType, object body) => default!;
    }
}
