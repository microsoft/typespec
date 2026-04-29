using System.ClientModel;
using System.ClientModel.Primitives;

namespace Sample
{
    public partial class TestClient
    {
        // Partial method declaration that customizes the generated protocol method's
        // signature (renames parameters). The generator emits the partial implementation.
        public partial ClientResult HelloAgain(BinaryContent content, RequestOptions options);
    }
}
