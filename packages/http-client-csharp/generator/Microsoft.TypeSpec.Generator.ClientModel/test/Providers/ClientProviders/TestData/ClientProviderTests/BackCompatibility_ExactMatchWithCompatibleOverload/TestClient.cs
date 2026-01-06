using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        // Exact match - this should be found and prevent any parameter reordering
        public virtual ClientResult ProcessData(BinaryContent content, string param2, bool param3, RequestOptions options)
        {
            throw new NotImplementedException();
        }

        public virtual Task<ClientResult> ProcessDataAsync(BinaryContent content, string param2, bool param3, RequestOptions options)
        {
            throw new NotImplementedException();
        }

        public virtual ClientResult ProcessData(string param1, string param2, bool param3, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        public virtual Task<ClientResult> ProcessDataAsync(string param1, string param2, bool param3, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }
    }
}
