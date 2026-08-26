#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        // Represents the previously published contract: parameter is named "oldParam".
        public virtual Task<ClientResult> GetSomethingAsync(string oldParam, RequestOptions options = null) { return null; }
        public virtual ClientResult GetSomething(string oldParam, RequestOptions options = null) { return null; }
    }
}
