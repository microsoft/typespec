using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult TestMethod(DateTimeOffset? requestDate, string ifMatch, RequestOptions options)
        {
            throw new NotImplementedException();
        }

        public virtual Task<ClientResult> TestMethodAsync(DateTimeOffset? requestDate, string ifMatch, RequestOptions options)
        {
            throw new NotImplementedException();
        }
    }
}
