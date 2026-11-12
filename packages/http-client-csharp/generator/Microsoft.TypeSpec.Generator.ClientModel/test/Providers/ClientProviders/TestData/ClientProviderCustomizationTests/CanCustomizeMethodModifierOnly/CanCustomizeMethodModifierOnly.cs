using System.ClientModel;
using System.ClientModel.Primitives;

namespace Sample
{
    public partial class TestClient
    {
        // Modifier-only customization: changes accessibility from public to internal,
        // keeps the generator-chosen parameter names (`p1`, `options`).
        internal partial ClientResult HelloAgain(BinaryContent p1, RequestOptions options);
    }
}
