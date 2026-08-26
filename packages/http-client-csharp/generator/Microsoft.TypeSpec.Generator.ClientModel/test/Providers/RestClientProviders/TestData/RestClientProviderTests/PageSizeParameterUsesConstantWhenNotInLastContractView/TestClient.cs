#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        // This represents a previous contract WITHOUT maxPageSize parameter
        public virtual Task<ClientResult> GetItemsAsync(string someOtherParam, CancellationToken cancellationToken = default) { return null; }
        public virtual ClientResult GetItems(string someOtherParam, CancellationToken cancellationToken = default) { return null; }
    }
}
