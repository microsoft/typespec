using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult UpdateResource(BinaryContent content, int param2, bool param3, RequestOptions options)
        {
            throw new NotImplementedException();
        }

        public virtual Task<ClientResult> UpdateResourceAsync(BinaryContent content, int param2, bool param3, RequestOptions options)
        {
            throw new NotImplementedException();
        }

        public virtual ClientResult<string> UpdateResource(string param1, int param2, bool param3, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        public virtual Task<ClientResult<string>> UpdateResourceAsync(string param1, int param2, bool param3, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }
    }
}
