
using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading;

namespace Sample
{
    /// <summary></summary>
    public partial class TestClient
    {
        public virtual ClientResult HelloAgain(IEnumerable<int> p1, CancellationToken cancellationToken = default)
        {
        }
    }
}
