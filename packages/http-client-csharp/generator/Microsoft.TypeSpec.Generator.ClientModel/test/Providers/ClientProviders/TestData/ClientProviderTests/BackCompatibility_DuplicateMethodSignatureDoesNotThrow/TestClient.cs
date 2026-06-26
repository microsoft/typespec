using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult TestMethod(BinaryContent content, RequestOptions options)
        {
            throw new NotImplementedException();
        }

        public virtual Task<ClientResult> TestMethodAsync(BinaryContent content, RequestOptions options)
        {
            throw new NotImplementedException();
        }
    }
}
