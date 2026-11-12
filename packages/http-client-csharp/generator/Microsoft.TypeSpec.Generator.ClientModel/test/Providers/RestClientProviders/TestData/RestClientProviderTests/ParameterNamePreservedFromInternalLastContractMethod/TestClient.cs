#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        internal virtual Task<ClientResult> GetSomethingAsync(string oldParam, RequestOptions options = null) { return null; }
        internal virtual ClientResult GetSomething(string oldParam, RequestOptions options = null) { return null; }
    }
}
