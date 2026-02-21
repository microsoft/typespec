#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    /// <summary>
    /// Represents the previous contract for the enclosing type (e.g., MockableResourceProvider)
    /// that has the "top" parameter in its public API methods.
    /// </summary>
    public partial class MockableTestResource
    {
        public virtual Task<ClientResult> GetItemsAsync(int? top, CancellationToken cancellationToken = default) { return null; }
        public virtual ClientResult GetItems(int? top, CancellationToken cancellationToken = default) { return null; }
    }
}
