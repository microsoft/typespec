using System.Collections.Generic;
using System.Threading;
using System.ClientModel;

namespace Sample
{
    public partial class TestClient
    {
        // Customizes the convenience method's signature: renames `p1` to `body` and
        // `cancellationToken` to `ct`. The generator emits a partial implementation
        // using these names while keeping the generated body.
        public partial ClientResult HelloAgain(IEnumerable<string> body, CancellationToken ct);
    }
}
