#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        // This represents the previous contract with top parameter
        public virtual Task<ClientResult> GetItemsAsync(int? top, CancellationToken cancellationToken = default) { return null; }
        public virtual ClientResult GetItems(int? top, CancellationToken cancellationToken = default) { return null; }
    }
}
