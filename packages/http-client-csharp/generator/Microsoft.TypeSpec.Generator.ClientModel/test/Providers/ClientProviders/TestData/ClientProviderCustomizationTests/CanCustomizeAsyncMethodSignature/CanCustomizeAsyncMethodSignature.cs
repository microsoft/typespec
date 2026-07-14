using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        // Partial method declaration that customizes the generated async protocol method's
        // signature (renames parameters). The generator emits the partial implementation, which
        // must carry the `async` modifier because the generated body uses `await`.
        public partial Task<ClientResult> HelloAgainAsync(BinaryContent content, RequestOptions options);
    }
}
