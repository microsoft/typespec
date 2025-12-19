using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult TestMethod(BinaryContent content, int param2, bool param3, RequestOptions options)
        {
            throw new NotImplementedException();
        }

        public virtual Task<ClientResult> TestMethodAsync(BinaryContent content, int param2, bool param3, RequestOptions options)
        {
            throw new NotImplementedException();
        }
    }
}
