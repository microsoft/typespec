using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult GetData(int param1, BinaryContent content, RequestOptions options = null)
        {
            throw new NotImplementedException();
        }

        public virtual Task<ClientResult> GetDataAsync(int param1, BinaryContent content, RequestOptions options = null)
        {
            throw new NotImplementedException();
        }
    }
}
