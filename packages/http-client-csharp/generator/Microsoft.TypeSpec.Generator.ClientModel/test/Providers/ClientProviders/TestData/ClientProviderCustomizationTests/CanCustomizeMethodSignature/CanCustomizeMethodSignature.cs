
using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Sample
{
    /// <summary></summary>
    public partial class TestClient
    {
        // Partial method declaration - matches protocol method signature
        public partial ClientResult HelloAgain(BinaryContent content, RequestOptions options);
    }
}
