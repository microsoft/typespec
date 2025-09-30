
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
        [CodeGenMethod("HelloAgain")]
        public partial void CustomHelloAgain(string[] items, RequestOptions options);
    }
}
