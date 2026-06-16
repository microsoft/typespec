using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult<string> GetData(int param2, string param1, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        public virtual Task<ClientResult<string>> GetDataAsync(int param2, string param1, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }
    }
}
